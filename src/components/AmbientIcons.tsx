import type { SVGProps } from 'react';
import type { AmbientSoundId } from '../core/ambientCatalog';

type IconProps = SVGProps<SVGSVGElement>;

export function AmbientSoundIcon({
  id,
  className = 'h-5 w-5',
  ...props
}: { id: AmbientSoundId } & IconProps) {
  const base: IconProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.65,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    ...props,
  };

  switch (id) {
    case 'white_noise':
      return (
        <svg {...base}>
          <path d="M4 12v0M8 8v8M12 5v14M16 9v6M20 11v2" />
        </svg>
      );
    case 'pink_noise':
      return (
        <svg {...base}>
          <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
          <path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" opacity="0.5" />
        </svg>
      );
    case 'brown_noise':
      return (
        <svg {...base}>
          <path d="M3 13c2.5-5 5-5 7.5 0s5 5 7.5 0 3-2.5 3-2.5" />
          <circle cx="12" cy="12" r="9" opacity="0.28" />
        </svg>
      );
    case 'binaural_alpha':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="6.5" opacity="0.65" />
          <circle cx="12" cy="12" r="9.5" opacity="0.35" />
        </svg>
      );
    case 'binaural_theta':
      return (
        <svg {...base}>
          <path d="M16.5 14.5A6.5 6.5 0 0 1 9.5 7.5a6.5 6.5 0 1 0 7 7Z" />
          <path d="M15 5c1.5 0 2.5 1 2.5 2.5" opacity="0.6" />
          <path d="M17.5 3.5c2 0 3.5 1.5 3.5 3.5" opacity="0.4" />
        </svg>
      );

    case 'light_rain':
      return (
        <svg {...base}>
          <path d="M6.5 15h11a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 8.2 6.8 3.8 3.8 0 0 0 6.5 15Z" />
          <path d="M9 18.5v1.5M13 18v1.5M16.5 18.5v1" />
        </svg>
      );
    case 'heavy_rain':
      return (
        <svg {...base}>
          <path d="M6.5 14h11a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 8.2 5.8 3.8 3.8 0 0 0 6.5 14Z" />
          <path d="M8 17l-1 3M11.5 17l-1 3.5M15 17l-1 3M18 17l-1 2.5" />
        </svg>
      );
    case 'rain_leaves':
      return (
        <svg {...base}>
          <path d="M11 4C7 5.5 5 9 6 13c4 0 7-2 8-6 0-1.5-1-2.5-3-3Z" />
          <path d="M6 13l4-4" />
          <path d="M16 11c2.5 1 3.5 3.5 3 6.5-2.5 0-4.5-1.5-5-4.5" />
          <path d="M7.5 17.5v1.5M11.5 16.5v1.5M18 6v1.5" />
        </svg>
      );
    case 'rain_window':
      return (
        <svg {...base}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M12 4v16M4 12h16" />
          <path d="M8 7.5v1.5M16 8.5v1.5M7.5 15.5v1.5M15.5 15v1.5" />
        </svg>
      );
    case 'rain_tent':
      return (
        <svg {...base}>
          <path d="M3 19L12 6l9 13H3Z" />
          <path d="M12 19v-5.5M9.5 19L12 13.5" />
          <path d="M6 6l-.5 2M17.5 5.5l-.5 2M12 3v1.5" opacity="0.7" />
        </svg>
      );
    case 'thunder':
      return (
        <svg {...base}>
          <path d="M6.5 14h11a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 8.2 5.8 3.8 3.8 0 0 0 6.5 14Z" />
          <path d="M13 13l-2.5 4h3l-2 4" />
        </svg>
      );

    case 'wind':
      return (
        <svg {...base}>
          <path d="M3 9h12.5a2.5 2.5 0 1 0-2.4-3.2" />
          <path d="M3 13h15.5a2.5 2.5 0 1 1-2.4 3.2" />
          <path d="M3 17h7.5a2 2 0 1 1-1.9 2.5" />
        </svg>
      );
    case 'wind_trees':
      return (
        <svg {...base}>
          <path d="M12 20v-8" />
          <path d="M12 4l-5 6h3.5l-4 5h11l-4-5H17L12 4Z" />
          <path d="M3 8h4M18 11h3" opacity="0.6" />
        </svg>
      );
    case 'waves':
      return (
        <svg {...base}>
          <path d="M3 11c2-2.5 4.5-2.5 6.5 0s4.5 2.5 6.5 0 3.5-2 5 0" />
          <path d="M3 16c2-2.5 4.5-2.5 6.5 0s4.5 2.5 6.5 0 3.5-2 5 0" />
        </svg>
      );
    case 'river':
      return (
        <svg {...base}>
          <path d="M7 4c3 3 3 5 0 8s-3 5 0 8" />
          <path d="M13 4c3 3 3 5 0 8s-3 5 0 8" />
          <path d="M18 7c1.5 2 1.5 3.5 0 5.5" opacity="0.6" />
        </svg>
      );
    case 'campfire':
      return (
        <svg {...base}>
          <path d="M12 3.5c2 2.5 3.5 4.5 3.5 7a3.5 3.5 0 1 1-7 0c0-1.5.7-2.8 1.5-4 .3 1.2 1 1.8 1.8 1.8-.3-1.6-.2-3.2.2-4.8Z" />
          <path d="M5 19l14-3M5 16l14 3" />
        </svg>
      );

    case 'birds':
      return (
        <svg {...base}>
          <path d="M3 10c2-2 4.5-1.5 6 1 1.5-2.5 4-3 6-1" />
          <path d="M11 16c1.5-1.5 3.5-1 4.5.8 1-1.8 3-2.3 4.5-.8" />
        </svg>
      );
    case 'crickets':
      return (
        <svg {...base}>
          <path d="M7 18c2-4 6-6 10-5" />
          <path d="M10 14l-2-4M14 13l2-3.5" />
          <path d="M16 6c1.5 0 2.5 1 2.5 2.5M18.5 4.5c1.8 0 3 1.2 3 3" opacity="0.65" />
        </svg>
      );
    case 'frog':
      return (
        <svg {...base}>
          <circle cx="8.5" cy="8.5" r="2" />
          <circle cx="15.5" cy="8.5" r="2" />
          <path d="M6.5 10.5C5 12 4.5 14 5.5 16c1.5 2 4 3 6.5 3s5-1 6.5-3c1-2 .5-4-1-5.5" />
          <path d="M9.5 15c1.5 1 3.5 1 5 0" />
        </svg>
      );
    case 'cat_purr':
      return (
        <svg {...base}>
          <path d="M5 9l1.5-4.5L10 7h4l3.5-2.5L19 9c1 1.5 1.5 3.5 1 5.5-.8 3-4 4.5-8 4.5s-7.2-1.5-8-4.5c-.5-2 0-4 1-5.5Z" />
          <path d="M9 12.5v.5M15 12.5v.5M11 15l1 1 1-1" />
        </svg>
      );
    case 'whale':
      return (
        <svg {...base}>
          <path d="M3 15c2.5 3 6.5 4 10.5 3 3-.8 5-3 5-5.5 0-3-2.5-5.5-6-5.5-4 0-6.5 2.5-7 5.5" />
          <path d="M18.5 12.5l3-2.5M18.5 12.5l2.5 3" />
          <circle cx="8.5" cy="11.5" r="0.7" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'train':
      return (
        <svg {...base}>
          <rect x="6" y="4" width="12" height="13" rx="2.5" />
          <path d="M6 11h12M9 14h.01M15 14h.01" />
          <path d="M8 17l-2 3M16 17l2 3M7 20h10" />
        </svg>
      );
    case 'highway':
      return (
        <svg {...base}>
          <path d="M7 4L3 20M17 4l4 16" />
          <path d="M12 5v2.5M12 10.5v3M12 16.5V20" />
        </svg>
      );
    case 'airplane':
      return (
        <svg {...base}>
          <path d="M12 3v18M12 8l8 5v2l-8-2.5M12 8l-8 5v2l8-2.5M12 17.5l3.5 2v1.5L12 19.5 8.5 21v-1.5l3.5-2Z" />
        </svg>
      );
    case 'cafe':
      return (
        <svg {...base}>
          <path d="M5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5v-4Z" />
          <path d="M16 11h2a2 2 0 0 1 0 4h-2" />
          <path d="M8 6.5c0-1 .8-1.5.8-2.5M12 6.5c0-1 .8-1.5.8-2.5" />
        </svg>
      );
    case 'library':
      return (
        <svg {...base}>
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H12v15H6.5A2.5 2.5 0 0 0 4 21V6.5Z" />
          <path d="M20 6.5A2.5 2.5 0 0 0 17.5 4H12v15h5.5a2.5 2.5 0 0 1 2.5 2.5V6.5Z" />
        </svg>
      );

    case 'singing_bowl':
      return (
        <svg {...base}>
          <path d="M4 11h16c0 4.5-3.5 8-8 8s-8-3.5-8-8Z" />
          <path d="M9 19h6" />
          <path d="M9 6.5c1.8-1.2 4.2-1.2 6 0" opacity="0.65" />
          <path d="M17.5 5l-2 4" />
        </svg>
      );
    case 'wind_chimes':
      return (
        <svg {...base}>
          <path d="M5 5h14" />
          <path d="M8 5v10M12 5v13M16 5v8" />
          <circle cx="12" cy="19.5" r="1.2" />
        </svg>
      );
    case 'warm_pad':
      return (
        <svg {...base}>
          <rect x="4" y="6" width="16" height="12" rx="3" />
          <path d="M7.5 12c1.2-2.5 2.5-2.5 3.5 0s2.3 2.5 3.5 0 2-1.5 2-1.5" />
        </svg>
      );
    case 'soft_piano':
      return (
        <svg {...base}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M9.5 5v8M14.5 5v8M12 13v6M8 13v6M16 13v6" />
          <path d="M9.5 5v7" strokeWidth="2.6" />
          <path d="M14.5 5v7" strokeWidth="2.6" />
        </svg>
      );
    case 'kalimba':
      return (
        <svg {...base}>
          <rect x="6" y="4" width="12" height="16" rx="4" />
          <path d="M9 4v7M11 4v8.5M13 4v8.5M15 4v7" />
          <circle cx="12" cy="15.5" r="1.8" />
        </svg>
      );

    // Additional Focus & Noise variants
    case 'binaural_beta':
    case 'binaural_delta':
    case 'binaural_gamma':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="6.5" opacity="0.65" />
          <circle cx="12" cy="12" r="9.5" opacity="0.35" />
        </svg>
      );
    case 'green_noise':
    case 'blue_noise':
    case 'violet_noise':
    case 'tape_hiss':
      return (
        <svg {...base}>
          <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
          <path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" opacity="0.5" />
        </svg>
      );
    case 'deep_sub':
    case 'space_drone':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M4.5 12h15M12 4.5a10 10 0 0 1 0 15" opacity="0.5" />
        </svg>
      );

    // Additional Rain & Nature variants
    case 'rain_car':
    case 'rain_umbrella':
    case 'droplets':
    case 'windshield_wipers':
      return (
        <svg {...base}>
          <path d="M6.5 15h11a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 8.2 6.8 3.8 3.8 0 0 0 6.5 15Z" />
          <path d="M9 18.5v1.5M13 18v1.5M16.5 18.5v1" />
        </svg>
      );
    case 'howling_wind':
    case 'rainy_porch':
      return (
        <svg {...base}>
          <path d="M3 9h12.5a2.5 2.5 0 1 0-2.4-3.2" />
          <path d="M3 13h15.5a2.5 2.5 0 1 1-2.4 3.2" />
          <path d="M3 17h7.5a2 2 0 1 1-1.9 2.5" />
        </svg>
      );
    case 'waterfall':
    case 'underwater':
    case 'bubbles':
      return (
        <svg {...base}>
          <path d="M7 4c3 3 3 5 0 8s-3 5 0 8" />
          <path d="M13 4c3 3 3 5 0 8s-3 5 0 8" />
          <circle cx="18" cy="8" r="1.5" opacity="0.7" />
        </svg>
      );
    case 'jungle':
    case 'walk_snow':
    case 'walk_gravel':
    case 'walk_leaves':
    case 'night_village':
      return (
        <svg {...base}>
          <path d="M12 20v-8" />
          <path d="M12 4l-5 6h3.5l-4 5h11l-4-5H17L12 4Z" />
        </svg>
      );

    // Additional Animal variants
    case 'owl':
    case 'seagulls':
    case 'woodpecker':
      return (
        <svg {...base}>
          <path d="M3 10c2-2 4.5-1.5 6 1 1.5-2.5 4-3 6-1" />
          <path d="M11 16c1.5-1.5 3.5-1 4.5.8 1-1.8 3-2.3 4.5-.8" />
        </svg>
      );
    case 'beehive':
    case 'sheep':
    case 'wolf':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="6" />
          <path d="M9 11.5v.5M15 11.5v.5M10.5 14.5c1 .8 2 .8 3 0" />
        </svg>
      );

    // Additional Travel & Places variants
    case 'train_outer':
    case 'subway':
      return (
        <svg {...base}>
          <rect x="6" y="4" width="12" height="13" rx="2.5" />
          <path d="M6 11h12M9 14h.01M15 14h.01" />
          <path d="M8 17l-2 3M16 17l2 3" />
        </svg>
      );
    case 'road':
    case 'traffic':
      return (
        <svg {...base}>
          <path d="M7 4L3 20M17 4l4 16" />
          <path d="M12 5v2.5M12 10.5v3M12 16.5V20" />
        </svg>
      );
    case 'rowing_boat':
    case 'sailboat':
    case 'submarine':
      return (
        <svg {...base}>
          <path d="M12 4v11M12 5l6 7h-6" />
          <path d="M4 17c2.5 2 5.5 2 8 0s5.5 2 8 0" />
        </svg>
      );
    case 'office':
    case 'restaurant':
      return (
        <svg {...base}>
          <path d="M5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5v-4Z" />
          <path d="M16 11h2a2 2 0 0 1 0 4h-2" />
        </svg>
      );

    // Cozy & Home
    case 'clock':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 2.5" />
        </svg>
      );
    case 'ceiling_fan':
    case 'washing_machine':
    case 'dryer':
    case 'laundry_room':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 4v5M12 15v5" opacity="0.5" />
        </svg>
      );
    case 'keyboard':
    case 'typewriter':
      return (
        <svg {...base}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M7 10h.01M10.5 10h.01M14 10h.01M17 10h.01M8 14h8" />
        </svg>
      );
    case 'paper':
      return (
        <svg {...base}>
          <path d="M6 4h9l4 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
          <path d="M15 4v4h4M9 12h6M9 16h4" />
        </svg>
      );
    case 'vinyl_effect':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="2.5" />
          <circle cx="12" cy="12" r="5.5" opacity="0.4" />
        </svg>
      );
    case 'boiling_water':
    case 'soft_hearth':
      return (
        <svg {...base}>
          <path d="M12 3.5c2 2.5 3.5 4.5 3.5 7a3.5 3.5 0 1 1-7 0c0-1.5.7-2.8 1.5-4" />
          <path d="M5 19h14" />
        </svg>
      );
    case 'temple':
    case 'church':
      return (
        <svg {...base}>
          <path d="M4 19h16M6 19v-7l6-5 6 5v7" />
          <path d="M12 4v3M10 19v-4h4v4" />
        </svg>
      );

    // Additional Instruments & Frequencies
    case 'pad_432hz':
    case 'pad_528hz':
    case 'pad_639hz':
    case 'pad_741hz':
    case 'pad_852hz':
    case 'flute_pad':
    case 'soft_organ':
    case 'cello_drone':
      return (
        <svg {...base}>
          <rect x="4" y="6" width="16" height="12" rx="3" />
          <path d="M7.5 12c1.2-2.5 2.5-2.5 3.5 0s2.3 2.5 3.5 0 2-1.5 2-1.5" />
        </svg>
      );
    case 'lofi_rhodes':
    case 'ambient_guitar':
      return (
        <svg {...base}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M9.5 5v8M14.5 5v8M12 13v6M8 13v6M16 13v6" />
        </svg>
      );
    case 'music_box':
    case 'harp_pluck':
    case 'hang_drum':
    case 'marimba':
    case 'koto_pluck':
    case 'crystal_bells':
    case 'temple_bell':
    case 'glockenspiel':
      return (
        <svg {...base}>
          <path d="M9 18V6l9-2v12" />
          <circle cx="7" cy="18" r="2.2" />
          <circle cx="16" cy="16" r="2.2" />
        </svg>
      );
  }
}
