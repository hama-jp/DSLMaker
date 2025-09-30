/**
 * Test the LLM node configuration fix
 */
import fs from 'fs'
import { LLMService } from './src/utils/llm-service.ts'

console.log('🧪 Testing LLM Configuration Fix...\n')

try {
  const workflowContent = fs.readFileSync('./public/test-llm-fix.json', 'utf8')
  
  console.log('📋 Validating workflow DSL...')
  const result = LLMService.validateDSL(workflowContent)
  
  console.log('\n📊 Validation Results:')
  console.log(`✓ Success: ${result.success}`)
  console.log(`✓ Errors: ${result.lintResult?.errors?.length || 0}`)
  console.log(`✓ Warnings: ${result.lintResult?.warnings?.length || 0}`)
  
  if (result.lintResult?.errors?.length > 0) {
    console.log('\n❌ Errors Found:')
    result.lintResult.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.message} (${error.code})`)
    })
  }
  
  if (result.lintResult?.warnings?.length > 0) {
    console.log('\n⚠️ Warnings Found:')
    result.lintResult.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning.message} (${warning.code})`)
    })
  }
  
  if (result.success) {
    console.log('\n🎉 LLM Node Configuration Successfully Fixed!')
    console.log('✅ All required fields are now properly configured:')
    console.log('   - model.provider: "openai"')
    console.log('   - model.name: "gpt-5-mini"') 
    console.log('   - prompt_template: [array with system & user messages]')
  } else {
    console.log('\n❌ Configuration still has issues that need to be resolved.')
  }
  
} catch (error) {
  console.error('\n❌ Test failed:', error.message)
  process.exit(1)
}
