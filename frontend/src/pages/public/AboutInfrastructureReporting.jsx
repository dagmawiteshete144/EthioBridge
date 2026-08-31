import {
  Building2, Route, Droplets, Zap, Waves, Link,
  Lightbulb, Trash2, Search, ClipboardCheck, ShieldCheck,
  Wrench, HardHat, MapPin,
} from 'lucide-react';
import {
  InfoHero, InfoSection, InfoCard, InfoSteps, InfoCheckList, InfoCTA,
} from '../../components/common/AboutInfoLayout';

const TYPES = [
  { icon: <Route size={24} strokeWidth={2} />, title: 'Roads', desc: 'Potholes, damaged surfaces, missing signage, and unsafe road conditions.', accent: 'from-sky-500 to-blue-600' },
  { icon: <Droplets size={24} strokeWidth={2} />, title: 'Water Supply', desc: 'Broken pipes, leaks, and interruptions in the public water supply.', accent: 'from-cyan-500 to-blue-600' },
  { icon: <Zap size={24} strokeWidth={2} />, title: 'Electricity', desc: 'Power outages, exposed wires, and faulty public electrical installations.', accent: 'from-yellow-500 to-amber-600' },
  { icon: <Waves size={24} strokeWidth={2} />, title: 'Drainage', desc: 'Blocked drains, flooding, and poor storm-water management.', accent: 'from-emerald-500 to-teal-600' },
  { icon: <Link size={24} strokeWidth={2} />, title: 'Bridges', desc: 'Structural damage, safety hazards, and maintenance needs on bridges.', accent: 'from-indigo-500 to-purple-600' },
  { icon: <Building2 size={24} strokeWidth={2} />, title: 'Public Buildings', desc: 'Damage to schools, health facilities, and other public structures.', accent: 'from-blue-600 to-indigo-700' },
  { icon: <Lightbulb size={24} strokeWidth={2} />, title: 'Street Lights', desc: 'Non-functional or damaged street lighting affecting public safety.', accent: 'from-amber-500 to-orange-600' },
  { icon: <Trash2 size={24} strokeWidth={2} />, title: 'Waste Management', desc: 'Garbage collection failures, illegal dumping, and sanitation issues.', accent: 'from-green-500 to-emerald-600' },
];

const WORKFLOW = [
  { step: 1, title: 'Describe the Issue', desc: 'Select a category and describe the infrastructure problem clearly and accurately.' },
  { step: 2, title: 'Add Photos & Location', desc: 'Attach photos and pinpoint the exact location on the map to help officials act faster.' },
  { step: 3, title: 'Submit the Report', desc: 'Submit with or without logging in — a tracking number is provided for guest reports.' },
  { step: 4, title: 'Routed to the Woreda', desc: 'The system routes your report to the responsible Woreda office for review and action.' },
  { step: 5, title: 'Track Your Report', desc: 'Follow the status of your report online using your tracking number.' },
  { step: 6, title: 'Escalation if Unresolved', desc: 'If the issue is not resolved at the Woreda level, it is automatically escalated to the Sub-City.' },
];

const VERIFICATION = [
  {
    icon: <Search size={24} strokeWidth={2} />,
    title: 'Review & Approval',
    desc: 'Government officials review each report and verify the details before work begins.',
    accent: 'from-sky-500 to-blue-600',
  },
  {
    icon: <MapPin size={24} strokeWidth={2} />,
    title: 'Evidence & Location',
    desc: 'Photos and GPS coordinates help officials confirm the issue and its exact location quickly.',
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    icon: <ShieldCheck size={24} strokeWidth={2} />,
    title: 'Severity-Based Priority',
    desc: 'Critical issues such as exposed power lines or major road hazards are prioritized for immediate action.',
    accent: 'from-rose-500 to-red-600',
  },
];

const REPAIR = [
  {
    icon: <HardHat size={24} strokeWidth={2} />,
    title: 'Assigned to the Responsible Department',
    desc: 'The relevant department or team is assigned to carry out the repair.',
    accent: 'from-amber-500 to-orange-600',
  },
  {
    icon: <Wrench size={24} strokeWidth={2} />,
    title: 'Work Progress Tracked',
    desc: 'The repair is tracked with status updates, so you always know where things stand.',
    accent: 'from-blue-600 to-indigo-600',
  },
  {
    icon: <ClipboardCheck size={24} strokeWidth={2} />,
    title: 'Completion & Notification',
    desc: 'You are notified when the work is completed and the report is resolved.',
    accent: 'from-emerald-500 to-green-600',
  },
];

const BENEFITS = [
  'Get infrastructure problems fixed faster',
  'No login required for guest submissions',
  'Track your report from submission to resolution',
  'Automatic escalation to the Sub-City if unresolved',
  'Transparent and accountable government response',
  'Help improve your neighborhood for everyone',
];

export default function AboutInfrastructureReporting() {
  return (
    <div className="overflow-hidden">
      <InfoHero
        badge="Infrastructure Reporting"
        title="Infrastructure Reporting"
        desc="Report damaged roads, water supply problems, electricity failures, drainage issues, damaged bridges, and other public infrastructure problems — and get them fixed faster."
      />

      <InfoSection eyebrow="What is Infrastructure Reporting?" title="What is Infrastructure Reporting?">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-black/10">
            <Building2 size={32} strokeWidth={2} />
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400 leading-relaxed">
            Infrastructure reporting lets citizens report problems with public facilities and services in their area —
            such as damaged roads, broken water supply, electricity failures, drainage problems, and damaged bridges.
          </p>
          <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            Your report is routed to the responsible Woreda office and followed up until the issue is fixed. If it is not
            resolved at the Woreda level, it is automatically escalated to the Sub-City.
          </p>
        </div>
      </InfoSection>

      <InfoSection
        eyebrow="What Can You Report?"
        title="Types of Infrastructure Issues"
        bg="bg-gray-50 dark:bg-gray-800"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TYPES.map((c) => (
            <InfoCard key={c.title} icon={c.icon} title={c.title} desc={c.desc} accent={c.accent} />
          ))}
        </div>
      </InfoSection>

      <InfoSection eyebrow="Step by Step" title="The Reporting Workflow">
        <InfoSteps steps={WORKFLOW} />
      </InfoSection>

      <InfoSection
        eyebrow="Verification"
        title="How Reports Are Verified"
        bg="bg-gray-50 dark:bg-gray-800"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VERIFICATION.map((p) => (
            <InfoCard key={p.title} icon={p.icon} title={p.title} desc={p.desc} accent={p.accent} />
          ))}
        </div>
      </InfoSection>

      <InfoSection eyebrow="From Start to Finish" title="Repair and Follow-up Process">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REPAIR.map((p) => (
            <InfoCard key={p.title} icon={p.icon} title={p.title} desc={p.desc} accent={p.accent} />
          ))}
        </div>
      </InfoSection>

      <InfoSection
        eyebrow="Why EthioBridge"
        title="Benefits of Reporting Infrastructure Issues"
        bg="bg-gray-50 dark:bg-gray-800"
      >
        <InfoCheckList items={BENEFITS} color="text-emerald-500" />
      </InfoSection>

      <InfoCTA
        title="Spot an Infrastructure Problem?"
        desc="Report it now and help your community get it fixed faster."
        actionLabel="Report Infrastructure"
        actionTo="/report/infrastructure"
      />
    </div>
  );
}
