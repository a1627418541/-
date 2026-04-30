const fetch = globalThis.fetch;

async function main() {
  try {
    const email = `testuser${Date.now()}@example.com`;
    const password = 'Test1234!';
    console.log('register', email);
    const regRes = await fetch('http://localhost:5175/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const regData = await regRes.json();
    console.log('register status', regRes.status, regData.success);
    const token = regData?.data?.token;
    if (!token) return;

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const sessionRes = await fetch('http://localhost:5175/api/game/sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ characterKey: 'linxiaonuan' }),
    });
    const sessionData = await sessionRes.json();
    console.log('session status', sessionRes.status, sessionData.success);
    if (!sessionData?.data?.id) return;

    const chatRes = await fetch('http://localhost:5175/api/chat/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({ sessionId: sessionData.data.id, content: '你好' }),
    });
    const chatData = await chatRes.json();
    console.log('chat status', chatRes.status, chatData.success);
    console.log(chatData);
  } catch (e) {
    console.error('error', e);
  }
}

main();
