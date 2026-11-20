import {
  Bath,
  Wind,
  DoorOpen,
  Library,
  Archive,
  Fan,
  Utensils,
  Wifi,
  BatteryCharging,
  WashingMachine,
  Dumbbell,
  Sparkles,
  Refrigerator,
  ShieldCheck,
  Droplets,
  Tv,
  Coffee,
  Fingerprint,
  Car,
  BookOpen,
  Armchair,
  LampDesk,
  CircleCheck,
  Check,
  type LucideIcon,
} from 'lucide-react';

type AmenityOption = { label: string; value: string; icon: LucideIcon };
const groups: { title: string; options: AmenityOption[] }[] = [
  {
    title: 'Amenities',
    options: [
      { label: 'Attached Balcony', value: 'Balcony', icon: DoorOpen },
      { label: 'Air Conditioning', value: 'AC', icon: Wind },
      { label: 'Attached Washroom', value: 'Attached Bathroom', icon: Bath },
      { label: 'Storage Shelf', value: 'Storage Shelf', icon: Library },
      { label: 'Spacious Cupboard', value: 'Wardrobe', icon: Archive },
      { label: 'Desert Cooler', value: 'Desert Cooler', icon: Fan },
    ],
  },
  {
    title: 'Services',
    options: [
      { label: 'Hot and Delicious Meals', value: 'Mess', icon: Utensils },
      { label: 'High-Speed Wi-Fi', value: 'Wi-Fi', icon: Wifi },
      { label: 'Power Backup', value: 'Power Backup', icon: BatteryCharging },
      { label: 'Laundry Service', value: 'Laundry', icon: WashingMachine },
      { label: 'Workout Zone', value: 'Workout Zone', icon: Dumbbell },
      { label: 'Professional Housekeeping', value: 'Housekeeping', icon: Sparkles },
      { label: 'Spacious Refrigerator', value: 'Refrigerator', icon: Refrigerator },
      { label: 'Washing Machine', value: 'Washing Machine', icon: WashingMachine },
      { label: '24×7 Security Surveillance', value: '24x7 Security', icon: ShieldCheck },
      { label: 'Hot Water Supply', value: 'Hot Water', icon: Droplets },
      { label: 'Water Purifier', value: 'Water Purifier', icon: Droplets },
      { label: 'Flat Screen Television', value: 'TV', icon: Tv },
      { label: 'In-House Cafeteria', value: 'Cafeteria', icon: Coffee },
      { label: 'Biometric Enabled Entry', value: 'Biometric Entry', icon: Fingerprint },
    ],
  },
];
const otherIcons: Record<string, LucideIcon> = {
  CCTV: ShieldCheck,
  Parking: Car,
  'Study Table': BookOpen,
  Chair: Armchair,
  Desk: LampDesk,
  Fan,
};

export function DiscoveryAmenityChips({
  available,
  selected,
  onChange,
}: {
  available: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const catalogValues = new Set(
    groups.flatMap((group) => group.options.map((option) => option.value)),
  );
  const other = [...new Set([...available, ...selected])]
    .filter((value) => !catalogValues.has(value))
    .map((value) => ({ label: value, value, icon: otherIcons[value] ?? CircleCheck }));
  const sections = [
    ...groups,
    ...(other.length ? [{ title: 'Other features', options: other }] : []),
  ];
  return (
    <div className="mt-6 space-y-6">
      <p className="text-xs leading-relaxed text-text-secondary">
        Choose the features that matter to you. Labels match the listed amenity; speeds, sizes and
        service schedules should be confirmed with the property team.
      </p>
      {sections.map((group) => (
        <fieldset key={group.title}>
          <legend className="mb-3 text-base font-semibold">{group.title}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.options.map(({ label, value, icon: Icon }) => {
              const checked = selected.includes(value);
              const listed = available.includes(value) || checked;
              return (
                <label
                  key={value}
                  className={`relative flex min-h-24 flex-col items-start justify-center gap-2 rounded-xl border p-3 text-xs transition-colors ${checked ? 'border-primary bg-primary-soft text-primary-dark' : listed ? 'cursor-pointer border-border hover:border-primary/50 hover:bg-primary-soft/40' : 'border-border/70 bg-background text-text-secondary'}`}
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    disabled={!listed}
                    onChange={() =>
                      onChange(
                        checked ? selected.filter((item) => item !== value) : [...selected, value],
                      )
                    }
                  />
                  <span className="absolute inset-0 rounded-xl peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary" />
                  <Icon
                    aria-hidden="true"
                    size={23}
                    strokeWidth={1.5}
                    className={listed ? 'text-primary' : 'text-text-secondary/50'}
                  />
                  <span>{label}</span>
                  {!listed && <span className="text-[10px] text-text-secondary">Not listed</span>}
                  {checked && (
                    <Check size={14} className="absolute top-3 right-3" aria-hidden="true" />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
