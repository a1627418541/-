const fetch = globalThis.fetch;

async function main() {
  try {
    const res = await fetch('http://127.0.0.1:5175/api/characters');
    console.log('status', res.status);
    const data = await res.text();
    console.log(data.slice(0, 500));
  } catch (e) {
    console.error('error', e.message);
  }
}

main();
