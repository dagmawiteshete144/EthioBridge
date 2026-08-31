import React from 'react';
import { ICONS } from '../../utils/iconMap.jsx';

const CATEGORY_ICON_MAP = {
  // infrastructure reports
  road_issue:            { icon: ICONS.road,            color: 'text-orange-500' },
  electricity_issue:     { icon: ICONS.electricity,     color: 'text-yellow-500' },
  water_supply_issue:    { icon: ICONS.water,           color: 'text-blue-500' },

  // public alerts
  flood:                 { icon: ICONS.flood,           color: 'text-blue-500' },
  rainfall:              { icon: ICONS.rainfall,        color: 'text-indigo-500' },
  road_closure:          { icon: ICONS.roadClosure,     color: 'text-orange-500' },
  health:                { icon: ICONS.healthFacility,  color: 'text-red-500' },
  power_outage:          { icon: ICONS.powerOutage,     color: 'text-yellow-500' },
  general:               { icon: ICONS.general,         color: 'text-slate-500' },
  security:              { icon: ICONS.security,        color: 'text-emerald-500' },
  public_service:        { icon: ICONS.publicService,   color: 'text-teal-500' },

  // campaigns / stories
  construction:          { icon: ICONS.construction,    color: 'text-orange-500' },
  education:             { icon: ICONS.education,       color: 'text-indigo-500' },
  health_campaign:       { icon: ICONS.healthCampaign,  color: 'text-red-500' },
  humanitarian:          { icon: ICONS.humanitarian,    color: 'text-emerald-500' },
  disaster_relief:       { icon: ICONS.disasterRelief,  color: 'text-orange-500' },
};

export const getCategoryIconInfo = (category) => CATEGORY_ICON_MAP[category] || {
  icon: ICONS.general,
  color: 'text-gray-500 dark:text-gray-400',
};

export default function CategoryIcon({ category, size = 16, className = '' }) {
  const { icon: Icon, color } = getCategoryIconInfo(category);
  return <Icon size={size} strokeWidth={2} className={`${color} ${className}`} />;
}
