import * as lucide from 'lucide-react';

// Central icon map — single source of truth for the app's icon system.
// Every icon in the app comes from here. Pages should use the canonical
// semantic names below (via AppIcon/getIcon) or render a lucide component
// directly — never inline emoji, react-icons, or raw SVG.

export const ICONS = {
  // ---- Canonical feature mappings (system-wide standard) ----
  dashboard: lucide.LayoutDashboard,
  reports: lucide.FileText,
  infrastructure: lucide.Construction,
  complaints: lucide.MessageSquareWarning,
  alerts: lucide.Megaphone,
  feedback: lucide.MessageSquareText,
  notifications: lucide.Bell,
  map: lucide.Map,
  analytics: lucide.ChartNoAxesCombined,
  users: lucide.Users,
  profile: lucide.UserRound,
  settings: lucide.Settings,
  logout: lucide.LogOut,
  news: lucide.Newspaper,
  campaigns: lucide.Megaphone,
  donations: lucide.Heart,
  search: lucide.Search,
  filter: lucide.ListFilter,
  view: lucide.Eye,
  edit: lucide.Pencil,
  delete: lucide.Trash2,
  download: lucide.Download,
  upload: lucide.Upload,
  save: lucide.Save,
  send: lucide.Send,
  add: lucide.Plus,
  close: lucide.X,
  success: lucide.CircleCheck,
  error: lucide.CircleX,
  warning: lucide.TriangleAlert,
  loading: lucide.LoaderCircle,
  empty: lucide.Inbox,

  // ---- Report & infrastructure categories ----
  road: lucide.Route,
  water: lucide.Droplets,
  electricity: lucide.Zap,
  school: lucide.School,
  healthFacility: lucide.Hospital,
  publicBuilding: lucide.Building2,
  streetlight: lucide.Lightbulb,
  sanitation: lucide.Trash2,

  // ---- Report status ----
  pending: lucide.Clock3,
  inProgress: lucide.LoaderCircle,
  assigned: lucide.UserCheck,
  resolved: lucide.CircleCheck,
  rejected: lucide.CircleX,
  upgraded: lucide.ArrowUpCircle,

  // ---- actions ----
  plus: lucide.Plus,
  minus: lucide.Minus,
  x: lucide.X,
  check: lucide.Check,
  editLine: lucide.PenLine,
  refresh: lucide.RefreshCw,
  copy: lucide.Copy,
  print: lucide.Printer,
  filterX: lucide.FilterX,
  more: lucide.MoreHorizontal,
  maximize: lucide.Maximize2,
  minimize: lucide.Minimize2,
  reply: lucide.Reply,
  forward: lucide.Forward,
  share: lucide.Share2,
  link: lucide.Link,
  external: lucide.ExternalLink,

  // ---- navigation ----
  home: lucide.Home,
  back: lucide.ArrowLeft,
  arrowRight: lucide.ArrowRight,
  arrowUp: lucide.ArrowUp,
  arrowDown: lucide.ArrowDown,
  arrowUpRight: lucide.ArrowUpRight,
  arrowUpDown: lucide.ArrowUpDown,
  chevronDown: lucide.ChevronDown,
  chevronUp: lucide.ChevronUp,
  chevronLeft: lucide.ChevronLeft,
  chevronRight: lucide.ChevronRight,
  menu: lucide.Menu,
  cog: lucide.Cog,

  // ---- entities / people ----
  user: lucide.UserRound,
  userPlus: lucide.UserPlus,
  userCheck: lucide.UserCheck,
  userRoundCheck: lucide.UserRoundCheck,
  userRoundX: lucide.UserRoundX,
  building: lucide.Building2,
  government: lucide.Landmark,
  homeIcon: lucide.Home,
  mapPin: lucide.MapPin,
  route: lucide.Route,
  compass: lucide.Compass,
  globe: lucide.Globe,
  language: lucide.Languages,
  phone: lucide.Phone,
  mail: lucide.Mail,

  // ---- status / feedback ----
  info: lucide.Info,
  help: lucide.CircleHelp,
  inReview: lucide.Eye,
  waiting: lucide.Hourglass,
  history: lucide.History,
  critical: lucide.CircleAlert,

  // ---- documents / data ----
  file: lucide.File,
  files: lucide.Files,
  fileText: lucide.FileText,
  filePlus: lucide.FilePlus2,
  fileCheck: lucide.FileCheck,
  fileSearch: lucide.FileSearch,
  fileWarning: lucide.FileWarning,
  folder: lucide.Folder,
  folderOpen: lucide.FolderOpen,
  folderClosed: lucide.FolderClosed,
  folderTree: lucide.FolderTree,
  clipboard: lucide.Clipboard,
  clipboardList: lucide.ClipboardList,
  clipboardCheck: lucide.ClipboardCheck,
  clipboardPen: lucide.ClipboardPen,
  clipboardType: lucide.ClipboardType,
  book: lucide.Book,
  bookOpen: lucide.BookOpen,
  bookMarked: lucide.BookMarked,
  scrollText: lucide.ScrollText,
  quote: lucide.Quote,
  newspaper: lucide.Newspaper,
  paperclip: lucide.Paperclip,
  inbox: lucide.Inbox,
  database: lucide.Database,
  package: lucide.Package,
  layers: lucide.Layers,
  network: lucide.Network,
  archive: lucide.Archive,

  // ---- communication / alerts ----
  bell: lucide.Bell,
  bellRing: lucide.BellRing,
  bellOff: lucide.BellOff,
  messageSquare: lucide.MessageSquare,
  messagesSquare: lucide.MessagesSquare,
  messageCircle: lucide.MessageCircle,
  messageSquareText: lucide.MessageSquareText,
  messageSquareReply: lucide.MessageSquareReply,
  messageSquareOff: lucide.MessageSquareOff,
  messageSquareWarning: lucide.MessageSquareWarning,
  megaphone: lucide.Megaphone,
  alert: lucide.TriangleAlert,
  shield: lucide.Shield,
  shieldCheck: lucide.ShieldCheck,
  shieldAlert: lucide.ShieldAlert,
  badgeAlert: lucide.BadgeAlert,
  badgeCheck: lucide.BadgeCheck,
  badgeDollarSign: lucide.BadgeDollarSign,
  keyRound: lucide.KeyRound,
  lock: lucide.Lock,
  lockKeyhole: lucide.LockKeyhole,
  unlock: lucide.Unlock,
  fingerprint: lucide.Fingerprint,

  // ---- alert / campaign categories ----
  flood: lucide.Waves,
  rainfall: lucide.CloudRain,
  roadClosure: lucide.TrafficCone,
  health: lucide.Hospital,
  powerOutage: lucide.Zap,
  general: lucide.Megaphone,
  security: lucide.ShieldCheck,
  publicService: lucide.Landmark,
  community: lucide.Handshake,
  education: lucide.GraduationCap,
  healthCampaign: lucide.Heart,
  humanitarian: lucide.HandHeart,
  disasterRelief: lucide.Flame,
  construction: lucide.Construction,
  transport: lucide.BusFront,
  telecom: lucide.Route,
  environment: lucide.Leaf,
  agriculture: lucide.Sprout,
  municipal: lucide.Wrench,
  medical: lucide.Stethoscope,
  heartPulse: lucide.HeartPulse,
  ambulance: lucide.Ambulance,
  weather: lucide.Cloud,
  wind: lucide.Wind,
  trees: lucide.Trees,
  fire: lucide.Flame,
  ethics: lucide.Scale,
  peace: lucide.ShieldCheck,

  // ---- money / analytics ----
  money: lucide.CircleDollarSign,
  banknote: lucide.Banknote,
  wallet: lucide.Wallet,
  creditCard: lucide.CreditCard,
  receipt: lucide.Receipt,
  piggyBank: lucide.PiggyBank,
  trendingUp: lucide.TrendingUp,
  chart: lucide.BarChart3,
  chartColumn: lucide.ChartNoAxesColumnIncreasing,
  chartPie: lucide.PieChart,
  target: lucide.Target,
  trophy: lucide.Trophy,
  gauge: lucide.Gauge,
  scale: lucide.Scale,
  flag: lucide.Flag,

  // ---- misc ----
  star: lucide.Star,
  sparkles: lucide.Sparkles,
  thumbsUp: lucide.ThumbsUp,
  thumbsDown: lucide.ThumbsDown,
  heart: lucide.Heart,
  handshake: lucide.Handshake,
  handHeart: lucide.HandHeart,
  palette: lucide.Palette,
  sun: lucide.Sun,
  moon: lucide.Moon,
  camera: lucide.Camera,
  image: lucide.Image,
  video: lucide.Video,
  smartphone: lucide.Smartphone,
  store: lucide.Store,
  pin: lucide.Pin,
  lightbulb: lucide.Lightbulb,
  wrench: lucide.Wrench,
  hammer: lucide.Hammer,
  ruler: lucide.Ruler,
  bird: lucide.Bird,
  navigation: lucide.Navigation,
  calendar: lucide.Calendar,
  calendarDays: lucide.CalendarDays,
  clock: lucide.Clock,
  clock3: lucide.Clock3,
  timer: lucide.Timer,
  alarmClock: lucide.AlarmClock,
  loader: lucide.Loader,
  loaderCircle: lucide.LoaderCircle,
  eye: lucide.Eye,
  eyeOff: lucide.EyeOff,
  mapPinned: lucide.MapPinned,
  bookmark: lucide.Bookmark,
  ban: lucide.Ban,
};

// ---- Resolvers ------------------------------------------------------------

// Strip U+FE0F variation selector (and any trailing selectors) for lookup.
const stripSelectors = (s) => (s || '').replace(/[\uFE0F\u200D]/g, '');

export const getIcon = (name) => ICONS[name] || null;

// Resolve any of: semantic name -> component, lucide component -> itself,
// emoji -> lucide equivalent (used only as a migration fallback).
export const resolveIcon = (icon) => {
  if (!icon) return null;
  if (typeof icon === 'string') {
    if (ICONS[icon]) return ICONS[icon];
    return EMOJI_ICONS[icon] || EMOJI_ICONS[stripSelectors(icon)] || null;
  }
  if (typeof icon === 'function') return icon;
  return null;
};

// Render a lucide icon from a semantic name, a lucide component, or an emoji.
export default function AppIcon({ name, icon, emoji, ...props }) {
  const Icon = resolveIcon(icon) || (name && resolveIcon(name)) || (emoji && getEmojiIcon(emoji));
  return Icon ? <Icon strokeWidth={2} {...props} /> : null;
}

// Functional emoji → lucide icon. Kept as a migration fallback only — new code
// should use semantic names. Keys use base code points (without the U+FE0F
// variation selector). Look up via getEmojiIcon / EmojiIcon which strip
// variation selectors automatically.
export const EMOJI_ICONS = {
  // announcements / alerts
  '📢': ICONS.megaphone, '📣': ICONS.megaphone, '🚨': ICONS.alert,
  '🔔': ICONS.bell, '🔴': ICONS.critical, '🛡': ICONS.shieldCheck,
  '🆕': ICONS.filePlus, '💬': ICONS.messageSquare,

  // status
  '✅': ICONS.success, '✔': ICONS.check, '✓': ICONS.check, '✕': ICONS.x,
  '❌': ICONS.error, '✗': ICONS.x, '✘': ICONS.x, '🟢': ICONS.success,
  '🟡': ICONS.warning, '🟠': ICONS.warning, '⚠': ICONS.warning, '⏳': ICONS.loaderCircle,
  '⏰': ICONS.alarmClock, '🕐': ICONS.clock, '🕒': ICONS.clock,

  // documents / data
  '📋': ICONS.clipboardList, '📝': ICONS.editLine, '📄': ICONS.fileText,
  '📑': ICONS.fileText, '📜': ICONS.scrollText, '📰': ICONS.newspaper,
  '📊': ICONS.chart, '📈': ICONS.trendingUp, '📂': ICONS.folderOpen,
  '📎': ICONS.paperclip, '📖': ICONS.bookOpen, '📚': ICONS.bookOpen,
  '🗑': ICONS.delete, '🔑': ICONS.keyRound, '🔍': ICONS.search,
  '📌': lucide.Pin, '📆': ICONS.calendarDays, '📅': ICONS.calendar,

  // entities / places
  '🏘': ICONS.building, '🏙': ICONS.building, '🏛': ICONS.government,
  '🏢': ICONS.building, '🏠': ICONS.homeIcon, '🗺': ICONS.map, '📍': ICONS.mapPin,
  '👤': ICONS.user, '👥': ICONS.users, '🙋': ICONS.user, '🏫': ICONS.school,
  '🏦': ICONS.banknote, '🏪': ICONS.store, '🏣': ICONS.mail, '🗽': ICONS.building,

  // infrastructure categories
  '🚧': ICONS.road, '⚡': ICONS.electricity, '💧': ICONS.water, '🌊': ICONS.flood,
  '🌧': ICONS.rainfall, '🏥': ICONS.health, '🎓': ICONS.education, '🚒': ICONS.fire,
  '🏗': ICONS.construction, '🚌': ICONS.transport, '🌳': ICONS.trees,
  '🌿': ICONS.environment, '🌾': ICONS.agriculture, '🚑': ICONS.ambulance,

  // communication / contact
  '📞': ICONS.phone, '✉': ICONS.mail, '📬': ICONS.mail, '📫': ICONS.mail,
  '📧': ICONS.mail, '🌐': ICONS.globe, '📡': ICONS.navigation, '📭': ICONS.inbox,
  '📱': ICONS.smartphone,

  // actions
  '🔄': ICONS.refresh, '🔁': ICONS.refresh, '⬆': ICONS.arrowUp, '⬇': ICONS.arrowDown,
  '➡': ICONS.arrowRight, '⬅': ICONS.back, '📥': ICONS.download, '📤': ICONS.upload,
  '📷': ICONS.camera, '📸': ICONS.camera, '🖨': ICONS.print, '🗂': ICONS.folder,
  '✍': ICONS.editLine, '✏': ICONS.editLine, '🛠': ICONS.wrench,
  '🔧': ICONS.wrench, '⚙': ICONS.settings, '🎨': ICONS.palette, '🚪': ICONS.logout,
  '🗝': ICONS.keyRound, '🔒': ICONS.lock, '🔓': ICONS.unlock, '👁': ICONS.eye,
  '🙈': ICONS.eyeOff,

  // misc
  '⭐': ICONS.star, '✨': ICONS.sparkles, '🌟': ICONS.star, '👍': ICONS.thumbsUp,
  '👎': ICONS.thumbsDown, '🤝': ICONS.handshake, '❤': ICONS.heart, '💖': ICONS.heart,
  '🙏': ICONS.heart, '🏁': ICONS.flag, '🎯': ICONS.target, '🏆': ICONS.trophy,
  '🎉': ICONS.sparkles, '⚖': ICONS.scale, '🕊': ICONS.bird, '💡': ICONS.lightbulb,
};

export const getEmojiIcon = (emoji) => {
  if (!emoji) return null;
  return EMOJI_ICONS[emoji] || EMOJI_ICONS[stripSelectors(emoji)] || null;
};

// Render the lucide equivalent of a functional emoji (falls back to the raw
// emoji when unmapped, e.g. flags or content emoji that must stay as text).
export function EmojiIcon({ emoji, size, className = '', fallback = null, ...props }) {
  const Icon = getEmojiIcon(emoji);
  if (!Icon) return fallback || emoji || null;
  return <Icon size={size} strokeWidth={2} className={className} {...props} />;
}
