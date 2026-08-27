const QOREBIT_API_KEY = process.env.QOREBIT_API_KEY || 'qb_live_vI39k_W01kgXXVbFLZa-9vRxAAtfOs-biA68fND2GgQ';

async function findEmbeddingModels() {
  try {
    const res = await fetch('https://api.qorebit.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${QOREBIT_API_KEY}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      const allModels = data.data ? data.data.map(m => m.id) : data;
      
      const embeddingModels = allModels.filter(id => 
        id.toLowerCase().includes('embed') || 
        id.toLowerCase().includes('bge') ||
        id.toLowerCase().includes('gte') ||
        id.toLowerCase().includes('text-')
      );

      console.log('Available Embedding Models on Qorebit:');
      console.log(embeddingModels);

      for (const model of embeddingModels) {
        process.stdout.write(`Testing: "${model}" ... `);
        const testRes = await fetch('https://api.qorebit.ai/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${QOREBIT_API_KEY}`,
          },
          body: JSON.stringify({
            model: model,
            input: 'Test legal search query',
          }),
        });

        if (testRes.ok) {
          const embData = await testRes.json();
          console.log(`✅ SUCCESS! Dimension: ${embData.data[0].embedding.length}`);
          console.log(`\n---> Use this exact ID in server.ts: "${model}"`);
          return;
        } else {
          console.log(`❌ Failed (${testRes.status})`);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findEmbeddingModels();