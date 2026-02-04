import { useState, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

import { API_BASE_URL } from '../../config';

interface Import {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filename: string;
  inventory_filename?: string;
  products_count: number;
  variants_count: number;
  images_count: number;
  collections_count: number;
  skipped_count: number;
  started_at: string | null;
  completed_at: string | null;
  duration: number | null;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ImportDetails extends Import {
  warnings: string[];
  error_messages: string | null;
}

export default function AdminImportPage() {
  const { getToken } = useAuth();
  const [productsFile, setProductsFile] = useState<File | null>(null);
  const [inventoryFile, setInventoryFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentImport, setCurrentImport] = useState<Import | null>(null);
  const [imports, setImports] = useState<Import[]>([]);
  const [selectedImport, setSelectedImport] = useState<ImportDetails | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchImports();
  }, []);

  // Poll for current import status
  useEffect(() => {
    if (!currentImport || !['pending', 'processing'].includes(currentImport.status)) {
      return;
    }

    const interval = setInterval(() => {
      fetchImportStatus(currentImport.id);
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [currentImport]);

  const fetchImports = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/imports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImports(response.data.data);
    } catch (error) {
      console.error('Failed to fetch imports:', error);
    }
  };

  const fetchImportStatus = async (importId: number) => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/imports/${importId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const importData = response.data.data;
      setCurrentImport(importData);
      
      // Update in list
      setImports(prev => prev.map(imp => imp.id === importId ? importData : imp));
      
      // If completed or failed, stop polling
      if (['completed', 'failed'].includes(importData.status)) {
        setCurrentImport(null);
        fetchImports(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to fetch import status:', error);
    }
  };

  const handleProductsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProductsFile(e.target.files[0]);
    }
  };

  // Currently unused - will be enabled when inventory import is ready
  const _handleInventoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInventoryFile(e.target.files[0]);
    }
  };
  void _handleInventoryFileChange;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'products' | 'inventory') => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (type === 'products') {
        setProductsFile(e.dataTransfer.files[0]);
      } else {
        setInventoryFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productsFile) {
      alert('Please select a products CSV file');
      return;
    }

    setIsUploading(true);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('products_file', productsFile);
      if (inventoryFile) {
        formData.append('inventory_file', inventoryFile);
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/imports`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setCurrentImport(response.data.data);
      setProductsFile(null);
      setInventoryFile(null);
      fetchImports();
    } catch (error: any) {
      console.error('Failed to start import:', error);
      alert(error.response?.data?.error || 'Failed to start import');
    } finally {
      setIsUploading(false);
    }
  };

  const viewImportDetails = async (importId: number) => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/imports/${importId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedImport(response.data.data);
    } catch (error) {
      console.error('Failed to fetch import details:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Import Products</h1>
          <p className="mt-2 text-gray-600">
            Upload Shopify product exports to quickly populate your store.
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-6 h-6 mr-2 text-hafalohaRed" />
            Upload Files
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Products File */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Products CSV <span className="text-red-600">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                  isDragging ? 'border-hafalohaRed bg-red-50' : 'border-gray-300 hover:border-hafalohaRed'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'products')}
                onClick={() => document.getElementById('products-file')?.click()}
              >
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                {productsFile ? (
                  <div>
                    <p className="text-green-600 font-medium">{productsFile.name}</p>
                    <p className="text-sm text-gray-500">{(productsFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700">Drop your products CSV here, or click to browse</p>
                    <p className="text-sm text-gray-500 mt-1">Shopify product export format</p>
                  </div>
                )}
                <input
                  id="products-file"
                  type="file"
                  accept=".csv"
                  onChange={handleProductsFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Inventory File - DISABLED UNTIL WE GET REAL DATA FROM HAFALOHA */}
            {/* 
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inventory CSV <span className="text-gray-500">(Optional)</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                  isDragging ? 'border-hafalohaRed bg-red-50' : 'border-gray-300 hover:border-hafalohaRed'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'inventory')}
                onClick={() => document.getElementById('inventory-file')?.click()}
              >
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                {inventoryFile ? (
                  <div>
                    <p className="text-green-600 font-medium">{inventoryFile.name}</p>
                    <p className="text-sm text-gray-500">{(inventoryFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700">Drop your inventory CSV here, or click to browse</p>
                    <p className="text-sm text-gray-500 mt-1">SKU and quantity data</p>
                  </div>
                )}
                <input
                  id="inventory-file"
                  type="file"
                  accept=".csv"
                  onChange={handleInventoryFileChange}
                  className="hidden"
                />
              </div>
            </div>
            */}

            {/* Note about inventory */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Inventory CSV upload will be enabled once we receive Hafaloha's inventory export format and test the implementation.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!productsFile || isUploading}
              className="w-full px-6 py-3 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Start Import
                </>
              )}
            </button>
          </form>
        </div>

        {/* Current Import Progress */}
        {currentImport && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Import in Progress</h2>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                <div>
                  <p className="font-medium text-gray-900">{currentImport.filename}</p>
                  <p className="text-sm text-gray-600 capitalize">{currentImport.status}...</p>
                </div>
              </div>
              {currentImport.status === 'processing' && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">You can leave this page - import will continue in the background</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Import History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Import History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skipped</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {imports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No imports yet. Upload your first CSV file above.
                    </td>
                  </tr>
                ) : (
                  imports.map((imp) => (
                    <tr key={imp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(imp.status)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(imp.status)}`}>
                            {imp.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{imp.filename}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {imp.products_count > 0 ? (
                          <span className="text-green-600 font-medium">
                            {imp.products_count} created
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {imp.skipped_count > 0 ? (
                          <span className="text-orange-600 font-medium">
                            {imp.skipped_count} skipped
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{imp.images_count || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(imp.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        <br />
                        <span className="text-xs text-gray-400">
                          {new Date(imp.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => viewImportDetails(imp.id)}
                          className="text-hafalohaRed hover:text-red-700"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Import Details Modal */}
        {selectedImport && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/10"
            onClick={() => setSelectedImport(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Import Details</h3>
                  <button
                    onClick={() => setSelectedImport(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center mt-1">
                    {getStatusIcon(selectedImport.status)}
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedImport.status)}`}>
                      {selectedImport.status}
                    </span>
                  </div>
                </div>

                {/* Files */}
                <div>
                  <label className="text-sm font-medium text-gray-500">File</label>
                  <p className="mt-1 text-gray-900">{selectedImport.filename}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Products</label>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{selectedImport.products_count}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Variants</label>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{selectedImport.variants_count}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Images</label>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{selectedImport.images_count}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Collections</label>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{selectedImport.collections_count}</p>
                  </div>
                </div>

                {selectedImport.skipped_count > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-800">
                      {selectedImport.skipped_count} product{selectedImport.skipped_count > 1 ? 's' : ''} skipped
                    </p>
                  </div>
                )}

                {/* Warnings (includes created products at top) */}
                {selectedImport.warnings && selectedImport.warnings.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1 text-yellow-600" />
                      Import Log
                    </label>
                    <ul className="mt-2 space-y-1 max-h-96 overflow-y-auto">
                      {selectedImport.warnings.map((warning, index) => {
                        const isCreated = warning.startsWith('✅ Created:');
                        const isSkipped = warning.includes('already exists');
                        return (
                          <li
                            key={index}
                            className={`text-sm p-2 rounded ${
                              isCreated
                                ? 'text-green-700 bg-green-50 font-medium'
                                : isSkipped
                                ? 'text-yellow-700 bg-yellow-50'
                                : 'text-gray-700 bg-gray-50'
                            }`}
                          >
                            {warning}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Errors */}
                {selectedImport.error_messages && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      <XCircle className="w-4 h-4 mr-1 text-red-600" />
                      Errors
                    </label>
                    <p className="mt-2 text-sm text-red-700 bg-red-50 p-3 rounded">{selectedImport.error_messages}</p>
                  </div>
                )}

                {/* Timing */}
                {selectedImport.duration && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p className="mt-1 text-gray-900">{selectedImport.duration.toFixed(2)} seconds</p>
                  </div>
                )}

                {/* User */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Imported By</label>
                  <p className="mt-1 text-gray-900">{selectedImport.user.name} ({selectedImport.user.email})</p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedImport(null)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

