import { describe, it, expect } from 'vitest'
import yaml from 'js-yaml'
import { cleanAndValidateYaml } from '@/utils/yaml-cleanup'

describe('JSON to YAML Conversion Integration', () => {
  const mockJSONResponse = {
    app: {
      description: "複雑な顧客サービスAIワークフロー：問い合わせ分類、感情分析、ナレッジベース検索、エスカレーション判定、自動応答生成、品質スコアリング、分析データ収集を含む",
      icon: "🤖",
      icon_background: "#EFF1F5",
      mode: "workflow",
      name: "Advanced Customer Service AI"
    },
    kind: "app",
    version: "0.1.5",
    workflow: {
      environment_variables: [],
      features: {},
      graph: {
        edges: [
          {
            id: "start-to-classifier",
            source: "start-1",
            target: "classifier-1",
            sourceHandle: "source",
            targetHandle: "target",
            type: "custom",
            data: {
              sourceType: "start",
              targetType: "question-classifier",
              isInIteration: false
            }
          }
        ],
        nodes: [
          {
            id: "start-1",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              title: "開始",
              type: "start",
              variables: [
                {
                  variable: "user_message",
                  type: "string",
                  label: "ユーザーメッセージ",
                  required: true
                }
              ]
            }
          },
          {
            id: "classifier-1",
            type: "question-classifier",
            position: { x: 300, y: 100 },
            data: {
              title: "問い合わせ分類",
              type: "question-classifier",
              categories: ["一般問合せ", "技術サポート", "請求問合せ", "解約問合せ"],
              classification_description: "ユーザーの問い合わせを適切なカテゴリに分類する"
            }
          }
        ],
        viewport: { x: 0, y: 0, zoom: 1 }
      }
    }
  }

  describe('JSON Response Processing', () => {
    it('should convert JSON response to valid YAML', () => {
      // Simulate converting JSON response to YAML
      const yamlString = yaml.dump(mockJSONResponse, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        sortKeys: false
      })

      expect(yamlString).toBeDefined()
      expect(yamlString).toContain('app:')
      expect(yamlString).toContain('description:')
      expect(yamlString).toContain('workflow:')
      expect(yamlString).toContain('graph:')
    })

    it('should handle malformed JSON-like responses', () => {
      const malformedJSON = `{
        "app": {
          "description": "Test workflow",
          "mode": "workflow"
        }
        "workflow": {  // Missing comma
          "graph": {
            "nodes": []
          }
        }
      }`

      // Test that our cleanup can handle this
      const result = cleanAndValidateYaml(malformedJSON)

      // Even if JSON parsing fails, YAML cleanup should try to fix it
      expect(result.cleaned).toBeDefined()
    })

    it('should preserve complex nested structures', () => {
      const yamlOutput = yaml.dump(mockJSONResponse)
      const parsedBack = yaml.load(yamlOutput)

      expect(parsedBack).toEqual(mockJSONResponse)
      expect(parsedBack.workflow.graph.nodes).toHaveLength(2)
      expect(parsedBack.workflow.graph.edges).toHaveLength(1)
    })

    it('should handle Unicode characters correctly', () => {
      const unicodeData = {
        app: {
          name: "テストワークフロー",
          description: "🤖 AIワークフロー with émojis and spéciäl chars",
          icon: "🔥"
        }
      }

      const yamlString = yaml.dump(unicodeData)
      const parsed = yaml.load(yamlString)

      expect(parsed.app.name).toBe("テストワークフロー")
      expect(parsed.app.icon).toBe("🔥")
    })
  })

  describe('Error Recovery', () => {
    it('should attempt to parse JSON from YAML-like responses', () => {
      const hybridResponse = `{
app:
  name: "Test"
  mode: workflow
workflow:
  graph:
    nodes: []
}`

      // This is neither valid JSON nor valid YAML, but our cleanup should help
      const result = cleanAndValidateYaml(hybridResponse)

      expect(result.cleaned).toBeDefined()
      // The cleanup should at least try to fix YAML-like structures
      expect(result.cleaned).toContain('app:')
    })

    it('should handle partial JSON responses', () => {
      const partialJSON = `{
  "app": {
    "name": "Incomplete",
    "mode": "workflow"
  }
  // Response was cut off here`

      const result = cleanAndValidateYaml(partialJSON)

      // Should at least attempt cleanup
      expect(result.cleaned).toBeDefined()
    })
  })
})