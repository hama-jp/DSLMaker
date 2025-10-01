# Dify DSL Node Templates (from real workflows)

## Available Node Types


### ANSWER Node

**Example 1** (from テスト_advanced-chat.yaml):
```json
{
  "id": "answer",
  "type": "answer",
  "data": {
    "answer": "{{#llm.text#}}",
    "desc": "",
    "selected": false,
    "title": "回答",
    "type": "answer",
    "variables": []
  },
  "position": {
    "x": 680,
    "y": 282
  }
}
```

**Example 2** (from AI_ポッドキャスト_advanced-chat.yaml):
```json
{
  "id": "answer",
  "type": "answer",
  "data": {
    "answer": "-----------------\nポッドキャストを作成中。しばらくおまちください。",
    "desc": "",
    "selected": false,
    "title": "音声作成中",
    "type": "answer",
    "variables": []
  },
  "position": {
    "x": 1284.7406572305918,
    "y": 400
  }
}
```

---

### ASSIGNER Node

**Example 1** (from DeepResearch_advanced-chat.yaml):
```json
{
  "id": "1739245826988",
  "type": "assigner",
  "data": {
    "desc": "",
    "isInIteration": true,
    "items": [
      {
        "input_type": "variable",
        "operation": "over-write",
        "value": [
          "1739245446901",
          "text"
        ],
        "variable_selector": [
          "conversation",
          "nextSearchTopic"
        ],
        "write_mode": "over-write"
      },
      {
        "input_type": "variable",
        "operation": "over-write",
        "value": [
          "1739245524260",
          "text"
        ],
        "variable_selector": [
          "conversation",
          "shouldContinue"
        ],
        "write_mode": "over-write"
      },
      {
        "input_type": "variable",
        "operation": "append",
        "value": [
          "conversation",
          "nextSearchTopic"
        ],
        "variable_selector": [
          "conversation",
          "topics"
        ],
        "write_mode": "over-write"
      }
    ],
    "iteration_id": "1739244888446",
    "selected": false,
    "title": "変数代入",
    "type": "assigner",
    "version": "2"
  },
  "position": {
    "x": 751.8559564663802,
    "y": 65
  }
}
```

**Example 2** (from DeepResearch_advanced-chat.yaml):
```json
{
  "id": "1739246085820",
  "type": "assigner",
  "data": {
    "desc": "",
    "isInIteration": true,
    "items": [
      {
        "input_type": "variable",
        "operation": "append",
        "value": [
          "1739245424964",
          "text"
        ],
        "variable_selector": [
          "conversation",
          "findings"
        ],
        "write_mode": "over-write"
      }
    ],
    "iteration_id": "1739244888446",
    "selected": false,
    "title": "変数代入",
    "type": "assigner",
    "version": "2"
  },
  "position": {
    "x": 606.0088891085952,
    "y": 628.4868835893722
  }
}
```

---

### CODE Node

**Example 1** (from ウェブの検索と要約のワークフローパターン_workflow.yaml):
```json
{
  "id": "1713262060182",
  "type": "code",
  "data": {
    "code": "import re\nimport time\ndef main(arg1) -> dict:\n    urls = re.findall(r'http[s]?://[^\\s)]+', arg1)\n    return {\n        \"result\": urls,\n    }",
    "code_language": "python3",
    "desc": "",
    "outputs": {
      "result": {
        "children": null,
        "type": "array[string]"
      }
    },
    "selected": false,
    "title": "Code",
    "type": "code",
    "variables": [
      {
        "value_selector": [
          "1713262010863",
          "text"
        ],
        "variable": "arg1"
      }
    ]
  },
  "position": {
    "x": 638,
    "y": 388.5
  }
}
```

**Example 2** (from ウェブの検索と要約のワークフローパターン_workflow.yaml):
```json
{
  "id": "1720759755103",
  "type": "code",
  "data": {
    "code": "import time\ndef main(arg1) -> dict:\n    result = []\n    for item in arg1:\n        url, text = item.split('\\\\SP')\n        text = text.replace('\\n', ' ')\n        result.append({'url':url, 'text':text})\n    return {\n        \"result\": result,\n    }\n",
    "code_language": "python3",
    "desc": "",
    "outputs": {
      "result": {
        "children": null,
        "type": "array[object]"
      }
    },
    "selected": false,
    "title": "Split URL and Text Summary",
    "type": "code",
    "variables": [
      {
        "value_selector": [
          "1716911333343",
          "output"
        ],
        "variable": "arg1"
      }
    ]
  },
  "position": {
    "x": 1987,
    "y": 388.5
  }
}
```

---

### DOCUMENT-EXTRACTOR Node

**Example 1** (from AI_ポッドキャスト_advanced-chat.yaml):
```json
{
  "id": "1754916862628",
  "type": "document-extractor",
  "data": {
    "desc": "",
    "is_array_file": false,
    "selected": false,
    "title": "テキスト抽出",
    "type": "document-extractor",
    "variable_selector": [
      "1754916346450",
      "file"
    ]
  },
  "position": {
    "x": 380,
    "y": 282
  }
}
```

**Example 2** (from AI_ポッドキャスト_advanced-chat.yaml):
```json
{
  "id": "1754916862628",
  "type": "document-extractor",
  "data": {
    "desc": "",
    "is_array_file": false,
    "selected": false,
    "title": "テキスト抽出",
    "type": "document-extractor",
    "variable_selector": [
      "1754916346450",
      "file"
    ]
  },
  "position": {
    "x": 380,
    "y": 282
  }
}
```

---

### END Node

**Example 1** (from 感情分析_workflow.yaml):
```json
{
  "id": "1711708653229",
  "type": "end",
  "data": {
    "desc": "",
    "outputs": [
      {
        "value_selector": [
          "1711708651402",
          "text"
        ],
        "variable": "text"
      }
    ],
    "selected": false,
    "title": "End",
    "type": "end"
  },
  "position": {
    "x": 943.6522881682833,
    "y": 3143.606627356191
  }
}
```

**Example 2** (from 感情分析_workflow.yaml):
```json
{
  "id": "1712457684421",
  "type": "end",
  "data": {
    "desc": "",
    "outputs": [
      {
        "value_selector": [
          "1711708925268",
          "text"
        ],
        "variable": "text"
      }
    ],
    "selected": false,
    "title": "End 2",
    "type": "end"
  },
  "position": {
    "x": 943.6522881682833,
    "y": 3019.7436097924674
  }
}
```

---

### IF-ELSE Node

**Example 1** (from 感情分析_workflow.yaml):
```json
{
  "id": "1711708770787",
  "type": "if-else",
  "data": {
    "conditions": [
      {
        "comparison_operator": "is",
        "id": "1711708913752",
        "value": "True",
        "variable_selector": [
          "1711708591503",
          "Multisentiment"
        ]
      }
    ],
    "desc": "",
    "logical_operator": "and",
    "selected": false,
    "title": "IF/ELSE",
    "type": "if-else"
  },
  "position": {
    "x": 362.5,
    "y": 3033.5
  }
}
```

**Example 2** (from 感情分析_workflow.yaml):
```json
{
  "id": "1711708770787",
  "type": "if-else",
  "data": {
    "conditions": [
      {
        "comparison_operator": "is",
        "id": "1711708913752",
        "value": "True",
        "variable_selector": [
          "1711708591503",
          "Multisentiment"
        ]
      }
    ],
    "desc": "",
    "logical_operator": "and",
    "selected": false,
    "title": "IF/ELSE",
    "type": "if-else"
  },
  "position": {
    "x": 362.5,
    "y": 3033.5
  }
}
```

---

### ITERATION Node

**Example 1** (from ウェブの検索と要約のワークフローパターン_workflow.yaml):
```json
{
  "id": "1716911333343",
  "type": "iteration",
  "data": {
    "desc": "",
    "height": 377,
    "iterator_selector": [
      "1713262060182",
      "result"
    ],
    "output_selector": [
      "1720758555344",
      "output"
    ],
    "output_type": "array[string]",
    "selected": false,
    "startNodeType": "tool",
    "start_node_id": "1716911333343start0",
    "title": "Iteration",
    "type": "iteration",
    "width": 985
  },
  "position": {
    "x": 942,
    "y": 388.5
  }
}
```

**Example 2** (from DeepResearch_advanced-chat.yaml):
```json
{
  "id": "1739244888446",
  "type": "iteration",
  "data": {
    "desc": "",
    "error_handle_mode": "terminated",
    "height": 1042,
    "is_parallel": false,
    "iterator_selector": [
      "1739245548624",
      "array"
    ],
    "output_selector": [
      "1739254296073",
      "output"
    ],
    "output_type": "array[string]",
    "parallel_nums": 10,
    "selected": false,
    "start_node_id": "1739244888446start",
    "title": "イテレーション",
    "type": "iteration",
    "width": 1186
  },
  "position": {
    "x": 650.8824354561594,
    "y": 550.399123970737
  }
}
```

---

### ITERATION-START Node

**Example 1** (from ウェブの検索と要約のワークフローパターン_workflow.yaml):
```json
{
  "id": "1716911333343start0",
  "type": "iteration-start",
  "data": {
    "desc": "",
    "isInIteration": true,
    "title": "",
    "type": "iteration-start"
  },
  "position": {
    "x": 24,
    "y": 68
  }
}
```

**Example 2** (from DeepResearch_advanced-chat.yaml):
```json
{
  "id": "1739244888446start",
  "type": "iteration-start",
  "data": {
    "desc": "",
    "isInIteration": true,
    "selected": false,
    "title": "",
    "type": "iteration-start"
  },
  "position": {
    "x": 24,
    "y": 68
  }
}
```

---

### LLM Node

**Example 1** (from テスト_advanced-chat.yaml):
```json
{
  "id": "llm",
  "type": "llm",
  "data": {
    "context": {
      "enabled": false,
      "variable_selector": []
    },
    "desc": "",
    "memory": {
      "query_prompt_template": "{{#sys.query#}}\n\n{{#sys.files#}}",
      "role_prefix": {
        "assistant": "",
        "user": ""
      },
      "window": {
        "enabled": false,
        "size": 10
      }
    },
    "model": {
      "completion_params": {
        "temperature": 0.7
      },
      "mode": "chat",
      "name": "unsloth/gpt-oss-20b",
      "provider": "langgenius/openai_api_compatible/openai_api_compatible"
    },
    "prompt_template": [
      {
        "role": "system",
        "text": ""
      }
    ],
    "selected": false,
    "title": "LLM",
    "type": "llm",
    "variables": [],
    "vision": {
      "enabled": false
    }
  },
  "position": {
    "x": 380,
    "y": 282
  }
}
```

**Example 2** (from 感情分析_workflow.yaml):
```json
{
  "id": "1711708651402",
  "type": "llm",
  "data": {
    "context": {
      "enabled": false,
      "variable_selector": []
    },
    "desc": "",
    "model": {
      "completion_params": {
        "frequency_penalty": 0,
        "max_tokens": 512,
        "presence_penalty": 0,
        "temperature": 0.7,
        "top_p": 1
      },
      "mode": "chat",
      "name": "gpt-3.5-turbo",
      "provider": "openai"
    },
    "prompt_template": [
      {
        "id": "d4fc418e-504e-42e6-b262-c1179c961e1c",
        "role": "system",
        "text": "You are a text sentiment analysis model. Analyze text sentiment, categorize, and extract positive and negative keywords. If no categories are provided, categories should be automatically determined. Assign a sentiment score (-1.0 to 1.0, in 0.1 increments). Return a JSON response only.\nAlways attempt to return a sentiment score without exceptions.\nDefine a sentiment score for each category that applies to the input text. Do not include categories that do not apply to the text. It is okay to skip categories. \nIMPORTANT: Format the output as a JSON. Only return a JSON response with no other comment or text. If you return any other text than JSON, you will have failed."
      },
      {
        "id": "cf3d4bd5-61d5-435e-b0f8-e262e7980934",
        "role": "user",
        "text": "input_text: The Pizza was delicious and staff was friendly , long wait.\ncategories: quality, service, price"
      },
      {
        "id": "760174bb-2bbe-44ab-b34c-b289f5b950b9",
        "role": "assistant",
        "text": "[\n\t\t\"category\": \"quality\",\n\t\t\"positive_keywords\": [\n\t\t\t\"delicious pizza\"\n\t\t],\n\t\t\"negative_keywords\": [],\n\t\t\"score\": 0.7,\n\t\t\"sentiment\": \"Positive\"\n\t},\n\t{\n\t\t\"category\": \"service\",\n\t\t\"positive_keywords\": [\n\t\t\t\"friendly staff\"\n\t\t],\n\t\t\"negative_keywords\": [],\n\t\t\"score\": 0.6,\n\t\t\"sentiment\": \"Positive\"\n\t}\n]"
      },
      {
        "id": "4b3d6b57-5e8b-48ef-af9d-766c6502bc00",
        "role": "user",
        "text": "input_text: {{#1711708591503.input_text#}}\n\ncategories: {{#1711708591503.Categories#}}"
      }
    ],
    "selected": false,
    "title": "Multisentiment is False",
    "type": "llm",
    "variables": [],
    "vision": {
      "enabled": false
    }
  },
  "position": {
    "x": 636.40862709903,
    "y": 3143.606627356191
  }
}
```

---

### START Node

**Example 1** (from test_workflow.yaml):
```json
{
  "id": "1758934875881",
  "type": "start",
  "data": {
    "title": "開始",
    "type": "start",
    "variables": []
  },
  "position": {
    "x": 80,
    "y": 282
  }
}
```

**Example 2** (from テスト_advanced-chat.yaml):
```json
{
  "id": "1754915045081",
  "type": "start",
  "data": {
    "desc": "",
    "selected": false,
    "title": "開始",
    "type": "start",
    "variables": []
  },
  "position": {
    "x": 80,
    "y": 282
  }
}
```

---

### TEMPLATE-TRANSFORM Node

**Example 1** (from AI_ポッドキャスト_advanced-chat.yaml):
```json
{
  "id": "1754920435754",
  "type": "template-transform",
  "data": {
    "desc": "",
    "selected": false,
    "template": "{{ arg1 }}\r\n{{ arg2 }}",
    "title": "テンプレート",
    "type": "template-transform",
    "variables": [
      {
        "value_selector": [
          "1754917555372",
          "text"
        ],
        "value_type": "string",
        "variable": "arg1"
      },
      {
        "value_selector": [
          "llm",
          "text"
        ],
        "value_type": "string",
        "variable": "arg2"
      }
    ]
  },
  "position": {
    "x": 1284.7406572305918,
    "y": 282
  }
}
```

**Example 2** (from ウェブの検索と要約のワークフローパターン_workflow.yaml):
```json
{
  "id": "1720758555344",
  "type": "template-transform",
  "data": {
    "desc": "",
    "isInIteration": true,
    "iteration_id": "1716911333343",
    "selected": false,
    "template": "{{ arg1 }}\\SP{{ text }}",
    "title": "Combine URL and Summary",
    "type": "template-transform",
    "variables": [
      {
        "value_selector": [
          "1716911333343",
          "item"
        ],
        "variable": "arg1"
      },
      {
        "value_selector": [
          "1716959261724",
          "text"
        ],
        "variable": "text"
      }
    ]
  },
  "position": {
    "x": 725,
    "y": 85
  }
}
```

---

### TOOL Node

**Example 1** (from ウェブの検索と要約のワークフローパターン_workflow.yaml):
```json
{
  "id": "1713262010863",
  "type": "tool",
  "data": {
    "desc": "",
    "provider_id": "tavily",
    "provider_name": "tavily",
    "provider_type": "builtin",
    "selected": false,
    "title": "TavilySearch",
    "tool_configurations": {
      "exclude_domains": null,
      "include_answer": 0,
      "include_domains": null,
      "include_images": 0,
      "include_raw_content": 0,
      "max_results": 10,
      "search_depth": "basic"
    },
    "tool_label": "TavilySearch",
    "tool_name": "tavily_search",
    "tool_parameters": {
      "query": {
        "type": "mixed",
        "value": "{{#1713261835258.Question#}}"
      }
    },
    "type": "tool"
  },
  "position": {
    "x": 331.7190223065919,
    "y": 388.5
  }
}
```

**Example 2** (from ウェブの検索と要約のワークフローパターン_workflow.yaml):
```json
{
  "id": "1720758285748",
  "type": "tool",
  "data": {
    "desc": "",
    "isInIteration": true,
    "isIterationStart": true,
    "iteration_id": "1716911333343",
    "provider_id": "jina",
    "provider_name": "jina",
    "provider_type": "builtin",
    "selected": false,
    "title": "JinaReader",
    "tool_configurations": {
      "gather_all_images_at_the_end": 0,
      "gather_all_links_at_the_end": 0,
      "image_caption": 0,
      "no_cache": 0,
      "proxy_server": null,
      "summary": 0,
      "target_selector": null,
      "wait_for_selector": null
    },
    "tool_label": "JinaReader",
    "tool_name": "jina_reader",
    "tool_parameters": {
      "url": {
        "type": "mixed",
        "value": "{{#1716911333343.item#}}"
      }
    },
    "type": "tool"
  },
  "position": {
    "x": 117,
    "y": 85
  }
}
```

---

### VARIABLE-AGGREGATOR Node

**Example 1** (from DeepResearch_advanced-chat.yaml):
```json
{
  "id": "1739254296073",
  "type": "variable-aggregator",
  "data": {
    "desc": "",
    "isInIteration": true,
    "iteration_id": "1739244888446",
    "output_type": "string",
    "selected": false,
    "title": "変数集約器",
    "type": "variable-aggregator",
    "variables": [
      [
        "1739254060247",
        "output"
      ],
      [
        "1739254516383",
        "output"
      ]
    ]
  },
  "position": {
    "x": 640.0246481283732,
    "y": 876.3796107886387
  }
}
```

---
