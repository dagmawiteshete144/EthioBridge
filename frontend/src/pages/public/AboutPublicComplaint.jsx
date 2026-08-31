import {
  Megaphone, ShieldCheck, Scale, Handshake,
  Landmark, FileSignature, ClipboardCheck, Route,
} from 'lucide-react';
import {
  InfoHero, InfoSection, InfoCard, InfoSteps, InfoCheckList, InfoCTA,
} from '../../components/common/AboutInfoLayout';

const CATEGORIES = [
  { icon: <Scale size={24} strokeWidth={2} />, title: 'Anti-Corruption', desc: 'Report corruption, bribery, misuse of public funds, or abuse of power by public officials.', accent: 'from-amber-500 to-orange-600' },
  { icon: <ShieldCheck size={24} strokeWidth={2} />, title: 'Peace and Security', desc: 'Report security concerns, public safety issues, and incidents that threaten community peace.', accent: 'from-rose-500 to-red-600' },
  { icon: <Landmark size={24} strokeWidth={2} />, title: 'Public Services', desc: 'Report problems with government services, delayed projects, poor work quality, and service failures.', accent: 'from-sky-500 to-blue-600' },
  { icon: <Handshake size={24} strokeWidth={2} />, title: 'Community Issues', desc: 'Report concerns that affect your neighborhood and community life.', accent: 'from-emerald-500 to-teal-600' },
];

const WHY_SUBMIT = [
  'Give citizens a direct voice to their local government',
  'Hold public offices accountable for their actions',
  'Improve the quality of public services in your area',
  'Help prevent corruption and misuse of public resources',
  'Receive an official response and follow-up on your concern',
  'Strengthen peace and security in your community',
];

const PROCESS_STEPS = [
  { step: 1, title: 'Submit Your Complaint', desc: 'Describe your complaint and choose a category. No account is required — you can submit as a guest.' },
  { step: 2, title: 'System Routes to the Responsible Office', desc: 'Your complaint is recorded and automatically forwarded to the responsible Woreda office.' },
  { step: 3, title: 'Woreda Reviews the Complaint', desc: 'The Woreda office reviews the complaint and determines how it will be addressed.' },
  { step: 4, title: 'Escalation to the Sub-City', desc: 'If the complaint is not resolved at the Woreda level, it is escalated to the Sub-City for further action.' },
  { step: 5, title: 'Feedback & Status Updates', desc: 'You receive status updates and feedback at every stage of the process.' },
  { step: 6, title: 'Complaint Resolved', desc: 'The issue is resolved and the complaint is closed with you notified of the outcome.' },
];

const REVIEW_POINTS = [
  {
    icon: <FileSignature size={24} strokeWidth={2} />,
    title: 'Woreda-Level Review',
    desc: 'Every complaint is first received by the responsible Woreda office, which reviews the details and takes the first action.',
    accent: 'from-primary-600 to-indigo-600',
  },
  {
    icon: <ClipboardCheck size={24} strokeWidth={2} />,
    title: 'Sub-City Oversight',
    desc: 'The Sub-City oversees the Woredas and handles complaints that escalate beyond the Woreda level, assigning them to the relevant department.',
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    icon: <Route size={24} strokeWidth={2} />,
    title: 'Transparent Tracking',
    desc: 'Every complaint has a tracking number so you can follow its progress and know exactly which authority is handling it.',
    accent: 'from-sky-500 to-blue-600',
  },
];

const BENEFITS = [
  'Submit complaints anonymously or with your account',
  'No login required for guest submissions',
  'Track your complaint status with a tracking number',
  'Automatic escalation ensures your complaint is not ignored',
  'Receive feedback at every stage of the process',
  'A transparent, accountable channel to your government',
];

export default function AboutPublicComplaint() {
  return (
    <div className="overflow-hidden">
      <InfoHero
        badge="Public Complaints"
        title="Public Complaint"
        desc="A secure channel to report corruption, peace and security concerns, public service problems, and other community issues directly to the responsible government authority."
      />

      <InfoSection eyebrow="What is a Public Complaint?" title="What is a Public Complaint?">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-black/10">
            <Megaphone size={32} strokeWidth={2} />
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400 leading-relaxed">
            A public complaint is a formal report you submit to your local government about issues that affect you and your
            community — such as corruption, peace and security problems, poor public services, or other community concerns.
          </p>
          <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            Through EthioBridge, your complaint is recorded, tracked, and forwarded to the responsible authority for review
            and action. You stay informed with status updates at every stage until the issue is resolved.
          </p>
        </div>
      </InfoSection>

      <InfoSection
        eyebrow="Why Submit a Complaint?"
        title="Why Citizens Should Submit Complaints"
        bg="bg-gray-50 dark:bg-gray-800"
      >
        <InfoCheckList items={WHY_SUBMIT} color="text-emerald-500" />
      </InfoSection>

      <InfoSection eyebrow="Complaint Categories" title="What Kind of Complaints Can You Submit?">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((c) => (
            <InfoCard key={c.title} icon={c.icon} title={c.title} desc={c.desc} accent={c.accent} />
          ))}
        </div>
      </InfoSection>

      <InfoSection
        eyebrow="How It Works"
        title="How the Complaint Process Works"
        bg="bg-gray-50 dark:bg-gray-800"
      >
        <InfoSteps steps={PROCESS_STEPS} />
      </InfoSection>

      <InfoSection eyebrow="Review & Action" title="How Complaints Are Reviewed by the Woreda or Sub-city">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEW_POINTS.map((p) => (
            <InfoCard key={p.title} icon={p.icon} title={p.title} desc={p.desc} accent={p.accent} />
          ))}
        </div>
      </InfoSection>

      <InfoSection
        eyebrow="Why EthioBridge"
        title="Benefits of Using the System"
        bg="bg-gray-50 dark:bg-gray-800"
      >
        <InfoCheckList items={BENEFITS} color="text-primary-500" />
      </InfoSection>

      <InfoCTA
        title="Have a Concern to Report?"
        desc="Submit your public complaint today and let the responsible authority take action."
        actionLabel="Submit a Complaint"
        actionTo="/report/public-complaint"
      />
    </div>
  );
}
