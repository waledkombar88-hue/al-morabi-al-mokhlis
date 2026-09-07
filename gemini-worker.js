// Cloudflare Worker backend for the public GitHub Pages site.
// Store GEMINI_API_KEY as a Worker secret. Never put the key in index.html.
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json; charset=utf-8'
    };
    if (request.method === 'OPTIONS') return new Response('', {headers: cors});
    if (request.method !== 'POST') return new Response(JSON.stringify({error:'POST only'}), {status:405, headers:cors});
    try {
      const body = await request.json();
      const question = String(body.question || '').trim();
      if (!question) return new Response(JSON.stringify({error:'السؤال فارغ'}), {status:400, headers:cors});
      const prompt = `أنت المربي الذكي في منصة المربي المخلص لطلاب الصف الرابع الابتدائي. أجب بالعربية الفصحى المبسطة، وقدم شرحًا قصيرًا وآمنًا ومناسبًا للعمر. لا تعطِ إجابات غش للاختبارات؛ علّم الطالب الطريقة. سؤال الطالب: ${question}`;
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
      });
      const data = await r.json();
      if (!r.ok) return new Response(JSON.stringify({error:data.error?.message || 'Gemini error'}), {status:r.status, headers:cors});
      const answer = data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('') || 'لم تصل إجابة.';
      return new Response(JSON.stringify({answer}), {headers:cors});
    } catch (e) {
      return new Response(JSON.stringify({error:'تعذر معالجة الطلب'}), {status:500, headers:cors});
    }
  }
};
