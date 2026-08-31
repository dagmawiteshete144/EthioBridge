export const INFRA_CATEGORIES = [
  { value: 'road_issue',         label: 'Road Issue',         icon: 'road' },
  { value: 'electricity_issue',  label: 'Electricity Issue',  icon: 'electricity' },
  { value: 'water_supply_issue', label: 'Water Supply Issue', icon: 'water' },
];

export const getCategoryLabel = (category) => {
  if (!category) return '';
  const found = INFRA_CATEGORIES.find(c => c.value === category);
  return found ? found.label : category;
};

export const getCategoryIcon = (category) => {
  const found = INFRA_CATEGORIES.find(c => c.value === category);
  return found ? found.icon : null;
};
