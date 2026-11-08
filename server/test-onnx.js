// Test script to verify ONNX model loads and runs inference
const ort = require('onnxruntime-node');
const path = require('path');

async function testModel() {
  console.log('🧪 Testing ONNX model...\n');

  const modelPath = path.join(__dirname, 'models', 'nexusroute_router_int8.onnx');

  try {
    // Load model
    console.log('Loading model from:', modelPath);
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['cpu']
    });
    console.log('✅ Model loaded successfully!');

    // Print model info
    console.log('\n📋 Model Inputs:');
    for (const input of session.inputNames) {
      const metadata = session.inputMetadata[input];
      console.log(`  - ${input}: type=${metadata.type}, dims=${metadata.dims}`);
    }

    console.log('\n📋 Model Outputs:');
    for (const output of session.outputNames) {
      const metadata = session.outputMetadata[output];
      console.log(`  - ${output}: type=${metadata.type}, dims=${metadata.dims}`);
    }

    // Test with sample prompt
    const testPrompt = "Patient SSN 123-45-6789 diagnosed with Asthma. Redact the SSN.";
    console.log('\n🎯 Test prompt:', testPrompt);

    // Tokenize (simple byte-level approximation for test)
    const tokenizer = require('./tokenizer-test');
    const tokens = tokenizer.encode(testPrompt);
    console.log('Encoded tokens:', tokens.length);

    // Pad/truncate to max_len=64
    const maxLen = 64;
    const inputIds = new Array(maxLen).fill(0);
    for (let i = 0; i < Math.min(tokens.length, maxLen); i++) {
      inputIds[i] = tokens[i];
    }

    // Create input tensor (batch_size=1, seq_len=64)
    const inputTensor = new ort.Tensor('int64', BigInt64Array.from(inputIds.map(BigInt)), [1, maxLen]);

    // Run inference
    const feeds = {};
    session.inputNames.forEach(name => {
      feeds[name] = inputTensor;
    });

    console.log('\n⚡ Running inference...');
    const results = await session.run(feeds);

    console.log('\n✅ Inference completed!');
    console.log('\n📊 Results:');

    for (const [name, value] of Object.entries(results)) {
      const data = value.data instanceof BigInt64Array ?
        Array.from(value.data).map(v => Number(v)) :
        value.data;
      console.log(`  ${name}:`, data);
    }

    // Parse results
    if (results.complexity_score) {
      const score = results.complexity_score.data;
      console.log(`\n📈 Complexity Score: ${score[0]}`);
    }

    if (results.model_tier_logits) {
      const logits = results.model_tier_logits.data;
      const tier = logits.indexOf(Math.max(...logits));
      console.log(`🏷️  Model Tier: ${tier}`);
    }

    if (results.flags_logits) {
      const flags = results.flags_logits.data;
      const flagNames = ['pii', 'code_exec', 'requires_symbolic_math', 'is_multipart'];
      console.log('🚩 Flags:', flagNames.map(f => f + ': ' + (flags[flagNames.indexOf(f)] > 0.5 ? 'YES' : 'NO')));
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
}

testModel();