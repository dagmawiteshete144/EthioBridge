require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const VolunteerTask = require('./src/models/VolunteerTask');
const VolunteerApplication = require('./src/models/VolunteerApplication');

const API = 'http://localhost:3000/api';
const pass = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) process.exitCode = 1; };

const stamp = Date.now();
const email = (p) => `${p}_step3_${stamp}@test.com`;
const emOrgBole = email('org_bole');
const emOrgYeka = email('org_yeka');
const emVol = email('vol');
const emVolNoWoreda = email('vol_noworeda');

const api = async (method, path, token, body) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
};

const login = async (emailAddr, password) => {
  const { status, json } = await api('POST', '/auth/login', null, { email: emailAddr, password });
  if (status !== 200 || !json.token) throw new Error(`login failed for ${emailAddr}: ${JSON.stringify(json)}`);
  return json.token;
};

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Mongo connected');

  const orgBole = await User.create({ fullName: 'Step3 Org Bole', email: emOrgBole, password: 'test123', role: 'subcity_bole', subcity: 'BOLE', isActive: true });
  const orgYeka = await User.create({ fullName: 'Step3 Org Yeka', email: emOrgYeka, password: 'test123', role: 'subcity_yeka', subcity: 'YEKA', isActive: true });
  const vol = await User.create({ fullName: 'Step3 Volunteer', email: emVol, password: 'test123', role: 'volunteer', subcity: 'BOLE', woredaName: 'Woreda 3', profession: 'Nurse', skills: ['First Aid'], isActive: true });

  const tokBole = await login(emOrgBole, 'test123');
  const tokYeka = await login(emOrgYeka, 'test123');
  const tokVol = await login(emVol, 'test123');

  const mkTask = async (token, t) => {
    const { status, json } = await api('POST', '/volunteer-tasks', token, t);
    if (status !== 201) throw new Error(`create task ${t.title} failed: ${JSON.stringify(json)}`);
    return json.task;
  };

  const t1 = await mkTask(tokBole, { title: 'Bole W1 cleanup', description: 'Cleanup in Woreda 1', location: 'Megenagna', requiredVolunteers: 3, priority: 'High', woredaName: 'Woreda 1', deadline: new Date(Date.now() + 7 * 864e5).toISOString() });
  const t2 = await mkTask(tokBole, { title: 'Bole W3 food drive', description: 'Food drive in Woreda 3', location: 'Bole Medhanialem', requiredVolunteers: 2, priority: 'Medium', woredaName: 'Woreda 3' });
  const t5 = await mkTask(tokBole, { title: 'Bole subcity-wide blood drive', description: 'Open to all Bole', location: 'Bole HQ', requiredVolunteers: 5, priority: 'High' });
  const t4 = await mkTask(tokBole, { title: 'Bole W3 closed task', description: 'Should never appear', location: 'X', requiredVolunteers: 1, priority: 'Low', woredaName: 'Woreda 3' });
  const t3 = await mkTask(tokYeka, { title: 'Yeka event', description: 'Yeka only', location: 'Yeka', requiredVolunteers: 1, priority: 'Low' });

  await VolunteerTask.findByIdAndUpdate(t4._id, { status: 'Closed' });

  const getAvail = async (token) => {
    const { json } = await api('GET', '/volunteer-tasks/available', token);
    return (json.tasks || []).map((x) => String(x._id));
  };

  let avail = await getAvail(tokVol);
  const has = (id) => avail.includes(String(id));
  pass('shows volunteer-own-woreda Open task (T2)', has(t2._id));
  pass('shows Sub-city-wide Open task (T5)', has(t5._id));
  pass('excludes task for a different woreda in same subcity (T1)', !has(t1._id));
  pass('excludes other-subcity task (T3)', !has(t3._id));
  pass('excludes non-Open (Closed) task (T4)', !has(t4._id));
  pass('avail count exactly 2', avail.length === 2);

  const applyT1 = await api('POST', `/volunteer-tasks/${t1._id}/apply`, tokVol, { reason: 'I can help', availabilityConfirmed: true });
  pass('apply to other-woreda task rejected (403)', applyT1.status === 403);

  const applied = await api('POST', `/volunteer-tasks/${t5._id}/apply`, tokVol, { reason: 'I can help', availabilityConfirmed: true });
  pass('apply to subcity-wide task succeeds', applied.status === 201 || applied.status === 200);

  avail = await getAvail(tokVol);
  pass('after pending apply: T5 excluded (already applied)', !has(t5._id));
  pass('after pending apply: T2 still available', has(t2._id));
  pass('after pending apply: avail count 1', avail.length === 1);

  const apps = await VolunteerApplication.find({ volunteer: vol._id }).lean();
  pass('one application exists', apps.length === 1);

  const appId = String(apps[0]._id);
  const approve = await api('PUT', `/volunteer-tasks/${t5._id}/applications/${appId}/approve`, tokBole, {});
  pass('org approves application', approve.status === 200);

  const assigned = await api('GET', '/volunteer-tasks/my-assigned', tokVol);
  pass('approved task appears in my-assigned', (assigned.json.applications || []).some((a) => String(a.task?._id || a.task) === String(t5._id)));

  avail = await getAvail(tokVol);
  pass('after approval: T5 not in available (assigned)', !has(t5._id));
  pass('after approval: T2 still available', has(t2._id));
  pass('final avail count 1', avail.length === 1);

  const detail = await api('GET', '/volunteer-tasks/available', tokVol);
  const card = (detail.json.tasks || [])[0];
  const fieldsOk = card && 'title' in card && 'description' in card && 'location' in card && 'woredaName' in card && 'subcity' in card && 'deadline' in card && 'priority' in card && 'requiredVolunteers' in card;
  pass('card exposes all required fields (title/desc/location/woreda/subcity/deadline/priority/requiredVolunteers)', Boolean(fieldsOk));
  pass('card subcity is BOLE', card && card.subcity === 'BOLE');
  pass('card woredaName present', card && !!card.woredaName);
  pass('card priority valid', card && ['High', 'Medium', 'Low'].includes(card.priority));
  pass('card requiredVolunteers is number', card && typeof card.requiredVolunteers === 'number');
  pass('card location populated', card && !!card.location);

  const st = await api('GET', '/volunteer-tasks/stats', tokVol);
  pass('stats.available === 1 consistent with list', st.json.stats && st.json.stats.available === 1);
  pass('stats.assigned === 1 (approved)', st.json.stats && st.json.stats.assigned === 1);

  await VolunteerTask.deleteMany({ createdBy: { $in: [orgBole._id, orgYeka._id] } });
  await VolunteerApplication.deleteMany({ volunteer: vol._id });
  await User.deleteMany({ _id: { $in: [orgBole._id, orgYeka._id, vol._id] } });
  console.log('cleanup done');
  await mongoose.disconnect();
  console.log(process.exitCode ? '\nRESULT: FAILURES PRESENT' : '\nRESULT: ALL PASS');
};

main().catch(async (e) => { console.error(e); process.exit(1); });
