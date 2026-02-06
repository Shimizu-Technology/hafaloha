import type { Fundraiser } from '../../services/fundraiserPublicService';

interface FundraiserHeroProps {
  fundraiser: Fundraiser;
}

export default function FundraiserHero({ fundraiser }: FundraiserHeroProps) {
  return (
    <div
      className="relative bg-cover bg-center h-64 md:h-80"
      style={{
        backgroundImage: fundraiser.image_url
          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${fundraiser.image_url}')`
          : 'linear-gradient(135deg, #C1191F 0%, #991B1B 100%)',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4">
          {fundraiser.organization_name && (
            <p className="text-sm md:text-base uppercase tracking-wider mb-2 opacity-90">
              {fundraiser.organization_name}
            </p>
          )}
          <h1 className="text-3xl md:text-5xl font-bold mb-2">{fundraiser.name}</h1>
          {!fundraiser.can_order && (
            <span className="inline-block px-4 py-2 bg-warm-800/80 rounded-full text-sm mt-4">
              This fundraiser has ended
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
