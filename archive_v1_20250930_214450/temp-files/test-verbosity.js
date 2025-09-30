const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testVerbosity(verbosity) {
  const requestBody = {
    model: process.env.OPENAI_MODEL,
    input: "Generate a simple Dify workflow JSON with error handling nodes, cache optimization, and timeout settings.",
    reasoning: { effort: "medium" },
    text: { verbosity: verbosity },
    max_output_tokens: 2000
  };

  const response = await fetch(`${process.env.OPENAI_BASE_URL}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const messageOutput = data.output.find(o => o.type === 'message');
  const textContent = messageOutput.content.find(c => c.type === 'output_text');

  return {
    verbosity: verbosity,
    responseLength: textContent.text.length,
    usage: data.usage,
    containsJSON: textContent.text.includes('{') && textContent.text.includes('}'),
    containsKeywords: ['error', 'cache', 'timeout'].filter(keyword =>
      textContent.text.toLowerCase().includes(keyword)
    ).length
  };
}

async function compareVerbosity() {
  console.log('🔍 Testing GPT-5 Verbosity Comparison...\n');

  try {
    const lowResult = await testVerbosity('low');
    console.log('📊 LOW Verbosity Results:');
    console.log(`   Response Length: ${lowResult.responseLength} chars`);
    console.log(`   Contains JSON: ${lowResult.containsJSON}`);
    console.log(`   Keywords Found: ${lowResult.containsKeywords}/3`);
    console.log(`   Tokens Used: ${lowResult.usage.total_tokens}\n`);

    const highResult = await testVerbosity('high');
    console.log('📊 HIGH Verbosity Results:');
    console.log(`   Response Length: ${highResult.responseLength} chars`);
    console.log(`   Contains JSON: ${highResult.containsJSON}`);
    console.log(`   Keywords Found: ${highResult.containsKeywords}/3`);
    console.log(`   Tokens Used: ${highResult.usage.total_tokens}\n`);

    console.log('🏆 COMPARISON SUMMARY:');
    console.log(`   Better for JSON: ${highResult.containsJSON === lowResult.containsJSON ? 'TIE' :
      (highResult.containsJSON ? 'HIGH' : 'LOW')}`);
    console.log(`   Better for Keywords: ${highResult.containsKeywords > lowResult.containsKeywords ? 'HIGH' :
      lowResult.containsKeywords > highResult.containsKeywords ? 'LOW' : 'TIE'}`);
    console.log(`   More Efficient: ${lowResult.usage.total_tokens < highResult.usage.total_tokens ? 'LOW' : 'HIGH'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

compareVerbosity();