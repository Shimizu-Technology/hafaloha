/**
 * Stripe Terminal SDK service for reader integration.
 * Handles reader discovery, connection, and payment collection.
 */
import { loadStripeTerminal } from '@stripe/terminal-js';
import type { Terminal, Reader, ErrorResponse } from '@stripe/terminal-js';

import { API_BASE_URL } from '../config';

let terminal: Terminal | null = null;
let connectedReader: Reader | null = null;

type TokenProvider = () => Promise<string | null>;
let tokenProvider: TokenProvider | null = null;

export function setTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

type StatusCallback = (status: TerminalStatus) => void;
let statusCallback: StatusCallback | null = null;

export type TerminalStatus =
  | 'not_initialized'
  | 'initializing'
  | 'initialized'
  | 'discovering'
  | 'connecting'
  | 'connected'
  | 'collecting_payment'
  | 'processing_payment'
  | 'disconnected'
  | 'error';

export interface TerminalState {
  status: TerminalStatus;
  reader: Reader | null;
  error: string | null;
}

function updateStatus(status: TerminalStatus) {
  statusCallback?.(status);
}

export function onStatusChange(callback: StatusCallback) {
  statusCallback = callback;
}

async function fetchConnectionToken(): Promise<string> {
  if (!tokenProvider) {
    throw new Error('Token provider not set. Call setTokenProvider() before initializing terminal.');
  }
  const token = await tokenProvider();
  if (!token) {
    throw new Error('Authentication token unavailable. Please sign in again.');
  }
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/stripe_terminal/connection_token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch connection token');
  }

  const data = await response.json();
  return data.secret;
}

function handleUnexpectedDisconnect() {
  console.warn('Stripe Terminal: Reader disconnected unexpectedly');
  connectedReader = null;
  updateStatus('disconnected');
}

function isTokenOrAuthError(message?: string): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('connectiontoken has already been redeemed') ||
    normalized.includes('authentication error') ||
    normalized.includes('hot swapped');
}

async function clearCachedCredentialsSafe(t: Terminal): Promise<void> {
  const result = await t.clearCachedCredentials();
  if ('error' in result) {
    throw new Error(result.error.message);
  }
}

export async function initializeTerminal(): Promise<Terminal> {
  if (terminal) return terminal;

  updateStatus('initializing');

  const StripeTerminal = await loadStripeTerminal();
  if (!StripeTerminal) {
    throw new Error('Failed to load Stripe Terminal SDK');
  }

  terminal = StripeTerminal.create({
    onFetchConnectionToken: fetchConnectionToken,
    onUnexpectedReaderDisconnect: handleUnexpectedDisconnect,
  });

  updateStatus('initialized');
  return terminal;
}

export async function discoverReaders(simulated = false): Promise<Reader[]> {
  const t = await initializeTerminal();
  updateStatus('discovering');

  let result = await t.discoverReaders({ simulated });

  if ('error' in result && isTokenOrAuthError(result.error.message)) {
    await clearCachedCredentialsSafe(t);
    result = await t.discoverReaders({ simulated });
  }

  if ('error' in result) {
    updateStatus('error');
    throw new Error((result as ErrorResponse).error.message);
  }

  updateStatus('initialized');
  return result.discoveredReaders;
}

export async function connectToReader(reader: Reader): Promise<Reader> {
  const t = await initializeTerminal();
  updateStatus('connecting');

  let result = await t.connectReader(reader);

  if ('error' in result && isTokenOrAuthError(result.error.message)) {
    await clearCachedCredentialsSafe(t);
    result = await t.connectReader(reader);
  }

  if ('error' in result) {
    updateStatus('error');
    throw new Error((result as ErrorResponse).error.message);
  }

  connectedReader = result.reader;
  updateStatus('connected');
  return result.reader;
}

export async function collectPayment(clientSecret: string) {
  const t = await initializeTerminal();

  if (!connectedReader) {
    throw new Error('No reader connected');
  }

  updateStatus('collecting_payment');

  const collectResult = await t.collectPaymentMethod(clientSecret);

  if ('error' in collectResult) {
    updateStatus('connected');
    throw new Error((collectResult as ErrorResponse).error.message);
  }

  updateStatus('processing_payment');
  const processResult = await t.processPayment(collectResult.paymentIntent);

  if ('error' in processResult) {
    updateStatus('connected');
    throw new Error((processResult as ErrorResponse).error.message);
  }

  updateStatus('connected');
  return processResult.paymentIntent;
}

export async function cancelPaymentCollection(): Promise<void> {
  const t = await initializeTerminal();
  await t.cancelCollectPaymentMethod();
  updateStatus('connected');
}

export async function disconnectReader(): Promise<void> {
  if (terminal && connectedReader) {
    await terminal.disconnectReader();
    connectedReader = null;
    updateStatus('initialized');
  }
}

export async function resetTerminalSession(): Promise<void> {
  const t = await initializeTerminal();

  try { await t.cancelCollectPaymentMethod(); } catch { /* ignore */ }
  try { if (connectedReader) await t.disconnectReader(); } catch { /* ignore */ }
  try { await clearCachedCredentialsSafe(t); } catch { /* ignore */ }

  connectedReader = null;
  updateStatus('initialized');
}

export function getConnectedReader(): Reader | null {
  return connectedReader;
}

export function isReaderConnected(): boolean {
  return connectedReader !== null;
}

export function destroyTerminal(): void {
  if (terminal) {
    if (connectedReader) {
      terminal.disconnectReader();
    }
    terminal = null;
    connectedReader = null;
    updateStatus('not_initialized');
  }
}
