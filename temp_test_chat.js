const fetch = globalThis.fetch;
(async () => {
  const email = `testuser${Date.now()}@example.com`;
  const password = 'Test1234!';
  console.log('Registering', email);
  const reg = await fetch('http://127.0.0.1:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const regData = await reg.json();
  console.log('Register', reg.status, JSON.stringify(regData));
  const token = regData?.data?.token;
  if (!token) return;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const sessionRes = await fetch('http://127.0.0.1:3001/api/game/sessions', {
    method: 'POST',
    headers,
    body: JSON.stringify({ characterKey: 'linxiaonuan' }),
  });
  const sessionData = await sessionRes.json();
  console.log('Session', sessionRes.status, JSON.stringify(sessionData));
  if (!sessionData?.data?.id) return;
  const sendRes = await fetch('http://127.0.0.1:3001/api/chat/send', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId: sessionData.data.id, content: '你好' }),
  });
  const sendData = await sendRes.json();
  console.log('Send', sendRes.status, JSON.stringify(sendData));
})().catch((e) => { console.error(e); process.exit(1); });
