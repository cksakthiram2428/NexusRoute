// Test script to verify ONNX model loads and runs inference
import ort from 'onnxruntime-node';
import fs from 'fs';
import path from 'path';

// Resolve model path directly
const modelPath = 'C:\\\\Users\\\\muthu raman\\\\VS Code\\\\NexusRoute\\\\server\\\\models\\\\nexusroute_router_int8.onnx';

async function testModel() {
  console.log('🧪 Testing ONNX model...\n');
  console.log('Model path:', modelPath);

  // Check file exists
  if (!fs.existsSync(modelPath)) {
    console.error('❌ Model file not found at:', modelPath);
    return;
  }
  const stats = fs.statSync(modelPath);
  console.log('📁 Model file size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');

  try {
    // Load model
    console.log('Loading model...');
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['cpu']
    });
    console.log('✅ Model loaded successfully!');

    // Print model info
    console.log('\n📋 Model Inputs:');
    for (const input of session.inputNames) {
      try {
        const metadata = session.inputMetadata[input];
        console.log(`  - ${input}: type=${metadata?.type}, dims=${metadata?.dims}`);
      } catch (e) {
        console.log(`  - ${input}: (metadata unavailable)`);
      }
    }

    console.log('\n📋 Model Outputs:');
    console.log('  Output names:', session.outputNames);

    // Simple tokenizer (character-based approximation for test)
    function simpleTokenize(text) {
      // Very simple approximation: 1 token per word, handle special tokens
      const tokens = [];
      const words = text.toLowerCase().replace(/[^a-z0-9\s\-']/, ' ').split(/\s+/).filter(Boolean);
      for (const word of words) {
        if (word.length > 0) {
          for (let i = 0; i < word.length; i++) {
            tokens.push(word.charCodeAt(i));
          }
        }
      }
      // Add CLS token (101) and SEP token (102)
      return [101, ...tokens.slice(0, 62), 102]; // 64 total including special tokens
    }

    // Test with sample prompt
    const testPrompt = "Patient SSN 123-45-6789 diagnosed with Asthma. Redact the SSN.";
    console.log('\n🎯 Test prompt:', testPrompt);

    // Tokenize
    const tokens = simpleTokenize(testPrompt);
    console.log('Encoded tokens:', tokens.length);

    // Create input tensor (batch_size=1, seq_len=64)
    const maxLen = 64;
    const inputIds = new Array(maxLen).fill(0);
    for (let i = 0; i < tokens.length; i++) {
      inputIds[i] = tokens[i];
    }

    const tensor = new ort.Tensor('int64', BigInt64Array.from(inputIds.map(BigInt)), [1, maxLen]);

    // Run inference
    const feeds = {};
    session.inputNames.forEach(name => {
      feeds[name] = tensor;
    });

    console.log('\n⚡ Running inference...');
    const startTime = Date.now();
    const results = await session.run(feeds);
    const latency = Date.now() - startTime;
    console.log(`⏱️  Inference latency: ${latency}ms`);

    console.log('\n✅ Inference completed!');
    console.log('\n📊 Results:');

    for (const [name, value] of Object.entries(results)) {
      const data = value.data;
      if (data instanceof Float32Array || data instanceof Float64Array || data instanceof Uint8Array || data instanceof Int32Array || data instanceof BigInt64Array || data instanceof BigUint64Array) {
        const nums = Array.from(data).map(v => Number(v));
        const ellipsis = nums.length > 10 ? ', ...' : '';
        console.log(`  ${name}: [${nums.slice(0, 10).join(', ')}${ellipsis}]`);
      } else if (Array.isArray(data)) {
        const ellipsis = data.length > 10 ? ', ...' : '';
        console.log(`  ${name}: [${data.slice(0, 10).join(', ')}${ellipsis}]`);
      } else {
        console.log(`  ${name}: ${JSON.stringify(value)}`);
      }
    }

    // Parse results
    console.log('\n📈 Parsed Results:');

    // Complexity score regression
    if (results.complexity_score || results.scalar_output) {
      const scoreResult = results.complexity_score || results.scalar_output;
      const score = scoreResult.data[0];
      console.log(`   Complexity Score: ${score.toFixed(2)}`);
    }

    // Model tier classification
    if (results.model_tier_logits || results.logits) {
      const logitsResult = results.model_tier_logits || results.logits;
      const logits = logitsResult.data;
      const tier = logits.indexOf(Math.max(...logits));
      const tierNames = ['LOCAL (Tier 0)', 'CLOUD_LITE (Tier 1)', 'CLOUD_FLAGSHIP (Tier 2)'];
      console.log(`   Model Tier: ${tierNames[tier]} (index ${tier})`);
    }

    // Flags
    if (results.flag_logits || results.binary_output) {
      const flagsResult = results.flag_logits || results.binary_output;
      const logits = flagsResult.data;
      const flagNames = ['PII', 'Code Exec', 'Symbolic Math', 'Multi-part'];
      // Apply sigmoid to get probabilities
      const probs = logits.map(logit => 1 / (1 + Math.exp(-logit)));
      console.log('   Flag probabilities:');
      flagNames.forEach((name, i) => {
        console.log(`     ${name}: ${(probs[i] * 100).toFixed(1)}%`);
      });
      const activeFlags = flagNames.filter((_, i) => probs[i] > 0.5);
      console.log(`   Active flags: ${activeFlags.length > 0 ? activeFlags.join(', ') : 'None'}`);
    }

    // Test with PII prompt
    console.log('\n🎯 Testing PII detection with sensitive prompt...');
    const piiPrompt = "Patient SSN 123-45-6789 diagnosed with Asthma, credit card 4532-1234-5678-9012. Redact sensitive data.";
    const tokens2 = simpleTokenize(piiPrompt);
    const inputIds2 = new Array(64).fill(0);
    for (let i = 0; i < tokens2.length; i++) inputIds2[i] = tokens2[i];
    const tensor2 = new ort.Tensor('int64', BigInt64Array.from(inputIds2.map(BigInt)), [1, 64]);
    const feeds2 = {};
    session.inputNames.forEach(name => feeds2[name] = tensor2);
    const results2 = await session.run(feeds2);
    const probs2 = results2.flag_logits.data.map(logit => 1 / (1 + Math.exp(-logit)));
    console.log('   PII probability:', (probs2[0] * 100).toFixed(1) + '%');

    console.log('\n✅ Model integration verified!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

testModel();