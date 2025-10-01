"""
Dify DSL Data Models
Based on real Dify 0.4.0 DSL exports from official samples

These models represent the ACTUAL structure of Dify DSL,
extracted from real workflow exports, not theoretical documentation.
"""
from typing import List, Dict, Any, Optional, Union, Literal
from pydantic import BaseModel, Field


# =============================================================================
# CORE NODE STRUCTURE
# =============================================================================

class DifyPosition(BaseModel):
    """Position coordinates for nodes"""
    x: float
    y: float


class DifyNodeBase(BaseModel):
    """
    Base structure for ALL Dify nodes

    In real Dify exports:
    - type is ALWAYS "custom" (or "custom-note", "custom-iteration-start")
    - The actual node type is in data.type
    - All nodes have position, positionAbsolute, height, width, etc.

    Note: Some fields are Optional to support both simplified and full Dify formats
    """
    id: str
    type: str  # Usually "custom", but can be "custom-note", "custom-iteration-start", or node type directly
    position: DifyPosition
    positionAbsolute: Optional[DifyPosition] = None  # Optional for simplified format
    selected: bool = False
    sourcePosition: str = "right"
    targetPosition: str = "left"
    height: Optional[int] = None  # Optional for simplified format
    width: Optional[int] = None  # Optional for simplified format
    data: Dict[str, Any]  # Node-specific data

    # Optional fields for special cases
    zIndex: Optional[int] = None
    parentId: Optional[str] = None  # For nodes inside iteration
    extent: Optional[str] = None  # "parent" for iteration children
    draggable: Optional[bool] = None  # False for iteration-start
    selectable: Optional[bool] = None  # False for iteration-start


# =============================================================================
# START NODE
# =============================================================================

class DifyStartVariable(BaseModel):
    """Start node variable definition"""
    variable: str
    label: str
    type: str  # text-input, paragraph, select, number-input, file
    required: bool = True
    max_length: Optional[int] = 48
    options: List[str] = Field(default_factory=list)


class DifyStartNodeData(BaseModel):
    """Start node data structure"""
    type: Literal["start"] = "start"
    title: str
    desc: str = ""
    selected: bool = False
    variables: List[DifyStartVariable]


# =============================================================================
# END NODE
# =============================================================================

class DifyEndOutput(BaseModel):
    """End node output definition"""
    variable: str
    value_selector: List[str]  # [node_id, field_name]


class DifyEndNodeData(BaseModel):
    """End node data structure"""
    type: Literal["end"] = "end"
    title: str
    desc: str = ""
    selected: bool = False
    outputs: List[DifyEndOutput]


# =============================================================================
# LLM NODE
# =============================================================================

class DifyLLMPrompt(BaseModel):
    """Single prompt in LLM prompt template"""
    id: str  # UUID
    role: str  # system, user, assistant
    text: str  # Can contain {{#node_id.field#}} references


class DifyLLMModel(BaseModel):
    """LLM model configuration"""
    provider: str  # openai, anthropic, etc.
    name: str  # gpt-4, claude-3, etc.
    mode: str  # chat, completion
    completion_params: Dict[str, Any]


class DifyLLMContext(BaseModel):
    """LLM context configuration"""
    enabled: bool = False
    variable_selector: List[Any] = Field(default_factory=list)


class DifyLLMVision(BaseModel):
    """LLM vision configuration"""
    enabled: bool = False
    configs: Optional[Dict[str, str]] = None  # {"detail": "high"}


class DifyLLMNodeData(BaseModel):
    """LLM node data structure"""
    type: Literal["llm"] = "llm"
    title: str
    desc: str = ""
    selected: bool = False
    model: DifyLLMModel
    prompt_template: List[DifyLLMPrompt]
    variables: List[Any] = Field(default_factory=list)
    context: DifyLLMContext
    vision: DifyLLMVision

    # Iteration-specific fields
    isInIteration: Optional[bool] = None
    iteration_id: Optional[str] = None


# =============================================================================
# IF-ELSE NODE
# =============================================================================

class DifyIfElseCondition(BaseModel):
    """Single condition in if-else node"""
    id: str
    variable_selector: List[str]  # [node_id, field_name]
    comparison_operator: str  # is, is not, contains, not contains, etc.
    value: str


class DifyIfElseNodeData(BaseModel):
    """If-else node data structure"""
    type: Literal["if-else"] = "if-else"
    title: str
    desc: str = ""
    selected: bool = False
    logical_operator: str = "and"  # and, or
    conditions: List[DifyIfElseCondition]


# =============================================================================
# CODE NODE
# =============================================================================

class DifyCodeVariable(BaseModel):
    """Code node input variable"""
    variable: str
    value_selector: List[str]  # [node_id, field_name]


class DifyCodeOutput(BaseModel):
    """Code node output definition"""
    type: str  # string, number, object, array[string], etc.
    children: Optional[Any] = None


class DifyCodeNodeData(BaseModel):
    """Code node data structure"""
    type: Literal["code"] = "code"
    title: str
    desc: str = ""
    selected: bool = False
    code: str  # Python code
    code_language: str = "python3"
    variables: List[DifyCodeVariable]
    outputs: Dict[str, DifyCodeOutput]


# =============================================================================
# ITERATION NODE
# =============================================================================

class DifyIterationNodeData(BaseModel):
    """
    Iteration node data structure

    Special characteristics:
    - Has width/height in data (unusual)
    - Has start_node_id pointing to iteration-start child
    - Child nodes have parentId pointing to this node
    """
    type: Literal["iteration"] = "iteration"
    title: str
    desc: str = ""
    selected: bool = False
    iterator_selector: List[str]  # [node_id, field_name] - array to iterate
    output_selector: List[str]  # [node_id, field_name] - last node in iteration
    output_type: str  # array[string], array[object], etc.
    startNodeType: str  # Type of first node in iteration (tool, llm, etc.)
    start_node_id: str  # ID of iteration-start node
    width: int
    height: int


class DifyIterationStartNodeData(BaseModel):
    """Iteration start node data structure"""
    type: Literal["iteration-start"] = "iteration-start"
    title: str = ""
    desc: str = ""
    isInIteration: bool = True


# =============================================================================
# TEMPLATE TRANSFORM NODE
# =============================================================================

class DifyTemplateVariable(BaseModel):
    """Template transform variable"""
    variable: str
    value_selector: List[str]  # [node_id, field_name]


class DifyTemplateTransformNodeData(BaseModel):
    """Template transform node data structure"""
    type: Literal["template-transform"] = "template-transform"
    title: str
    desc: str = ""
    selected: bool = False
    template: str  # Jinja2-like template
    variables: List[DifyTemplateVariable]

    # Iteration-specific fields
    isInIteration: Optional[bool] = None
    iteration_id: Optional[str] = None


# =============================================================================
# TOOL NODE
# =============================================================================

class DifyToolParameter(BaseModel):
    """Tool parameter definition"""
    type: str  # mixed, string, number, etc.
    value: str  # Can contain {{#node_id.field#}} references


class DifyToolNodeData(BaseModel):
    """Tool node data structure"""
    type: Literal["tool"] = "tool"
    title: str
    desc: str = ""
    selected: bool = False
    provider_id: str  # tavily, jina, etc.
    provider_name: str
    provider_type: str  # builtin, api
    tool_name: str  # tavily_search, jina_reader, etc.
    tool_label: str
    tool_parameters: Dict[str, DifyToolParameter]
    tool_configurations: Dict[str, Any]

    # Iteration-specific fields
    isInIteration: Optional[bool] = None
    iteration_id: Optional[str] = None


# =============================================================================
# ANSWER NODE (for advanced-chat mode)
# =============================================================================

class DifyAnswerNodeData(BaseModel):
    """Answer node data structure (streaming output)"""
    type: Literal["answer"] = "answer"
    title: str
    desc: str = ""
    selected: bool = False
    answer: str  # Variable reference like {{#llm.text#}}
    variables: List[Any] = Field(default_factory=list)


# =============================================================================
# VARIABLE ASSIGNER NODE (for conversation variables)
# =============================================================================

class DifyAssignerItem(BaseModel):
    """Variable assignment item"""
    variable_selector: List[str]  # [conversation, var_name]
    input_type: str  # variable, constant
    value: Union[List[str], str, int, float]  # Can be selector or literal
    operation: str  # over-write, append, clear
    write_mode: str = "over-write"


class DifyAssignerNodeData(BaseModel):
    """Variable assigner node data structure"""
    type: Literal["assigner"] = "assigner"
    title: str
    desc: str = ""
    selected: bool = False
    version: str = "2"
    items: List[DifyAssignerItem]

    # Iteration-specific fields
    isInIteration: Optional[bool] = None
    iteration_id: Optional[str] = None


# =============================================================================
# VARIABLE AGGREGATOR NODE
# =============================================================================

class DifyVariableAggregatorNodeData(BaseModel):
    """Variable aggregator node data structure"""
    type: Literal["variable-aggregator"] = "variable-aggregator"
    title: str
    desc: str = ""
    selected: bool = False
    output_type: str  # string, array[string], etc.
    variables: List[List[str]]  # List of [node_id, field_name] selectors

    # Iteration-specific fields
    isInIteration: Optional[bool] = None
    iteration_id: Optional[str] = None


# =============================================================================
# DOCUMENT EXTRACTOR NODE
# =============================================================================

class DifyDocumentExtractorNodeData(BaseModel):
    """Document extractor node data structure"""
    type: Literal["document-extractor"] = "document-extractor"
    title: str
    desc: str = ""
    selected: bool = False
    variable_selector: List[str]  # [node_id, field_name] - file input
    is_array_file: bool = False


# =============================================================================
# CUSTOM NOTE (not a functional node, just annotation)
# =============================================================================

class DifyCustomNoteNodeData(BaseModel):
    """Custom note data structure (annotation only)"""
    type: Literal[""] = ""  # Empty string for custom notes
    title: str = ""
    desc: str = ""
    selected: bool = False
    text: str  # Rich text JSON
    author: str
    showAuthor: bool = True
    theme: str = "blue"  # blue, yellow, pink, etc.
    width: int
    height: int


# =============================================================================
# EDGE STRUCTURE
# =============================================================================

class DifyEdgeData(BaseModel):
    """Edge data structure"""
    sourceType: str  # start, llm, if-else, etc.
    targetType: str
    isInIteration: bool = False
    iteration_id: Optional[str] = None


class DifyEdge(BaseModel):
    """
    Edge structure in Dify

    sourceHandle can be:
    - "source" for normal flow
    - "true" for if-else true branch
    - "false" for if-else false branch
    """
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = "source"
    targetHandle: Optional[str] = "target"
    type: str = "custom"
    data: Optional[DifyEdgeData] = None  # Optional for simplified format
    selected: bool = False
    zIndex: Optional[int] = None


# =============================================================================
# GRAPH STRUCTURE
# =============================================================================

class DifyViewport(BaseModel):
    """Viewport configuration"""
    x: float
    y: float
    zoom: float


class DifyGraph(BaseModel):
    """Complete graph structure"""
    nodes: List[DifyNodeBase]
    edges: List[DifyEdge]
    viewport: Optional[DifyViewport] = None  # Optional for simplified format


# =============================================================================
# CONVERSATION VARIABLES (for advanced-chat mode)
# =============================================================================

class DifyConversationVariable(BaseModel):
    """Conversation variable definition"""
    id: str
    name: str
    value_type: str  # string, number, array[string], array[object], etc.
    value: Any  # Default value
    description: str = ""
    selector: List[str]  # [conversation, var_name]


# =============================================================================
# FEATURES
# =============================================================================

class DifyFileUploadImage(BaseModel):
    """File upload image configuration"""
    enabled: bool = False
    number_limits: int = 3
    transfer_methods: List[str] = ["local_file", "remote_url"]


class DifyFileUploadConfig(BaseModel):
    """Detailed file upload limits"""
    audio_file_size_limit: int = 50
    batch_count_limit: int = 5
    file_size_limit: int = 15
    image_file_size_limit: int = 10
    video_file_size_limit: int = 100
    workflow_file_upload_limit: int = 10


class DifyFileUpload(BaseModel):
    """File upload feature configuration"""
    image: DifyFileUploadImage
    enabled: Optional[bool] = None
    allowed_file_types: Optional[List[str]] = None
    allowed_file_extensions: Optional[List[str]] = None
    allowed_file_upload_methods: Optional[List[str]] = None
    fileUploadConfig: Optional[DifyFileUploadConfig] = None
    number_limits: Optional[int] = None


class DifyRetrieverResource(BaseModel):
    """Retriever resource (RAG) configuration"""
    enabled: bool = False


class DifySensitiveWordAvoidance(BaseModel):
    """Sensitive word filtering"""
    enabled: bool = False


class DifySpeechToText(BaseModel):
    """Speech to text configuration"""
    enabled: bool = False


class DifyTextToSpeech(BaseModel):
    """Text to speech configuration"""
    enabled: bool = False
    language: str = ""
    voice: str = ""


class DifySuggestedQuestionsAfterAnswer(BaseModel):
    """Suggested questions configuration"""
    enabled: bool = False


class DifyFeatures(BaseModel):
    """Workflow features configuration"""
    file_upload: DifyFileUpload
    opening_statement: str = ""
    retriever_resource: Optional[DifyRetrieverResource] = None
    sensitive_word_avoidance: Optional[DifySensitiveWordAvoidance] = None
    speech_to_text: Optional[DifySpeechToText] = None
    suggested_questions: List[str] = Field(default_factory=list)
    suggested_questions_after_answer: Optional[DifySuggestedQuestionsAfterAnswer] = None
    text_to_speech: Optional[DifyTextToSpeech] = None


# =============================================================================
# WORKFLOW STRUCTURE
# =============================================================================

class DifyWorkflow(BaseModel):
    """Complete workflow structure"""
    conversation_variables: List[DifyConversationVariable] = Field(default_factory=list)
    environment_variables: List[Any] = Field(default_factory=list)
    features: DifyFeatures
    graph: DifyGraph
    rag_pipeline_variables: List[Any] = Field(default_factory=list)


# =============================================================================
# DEPENDENCIES
# =============================================================================

class DifyDependencyValue(BaseModel):
    """Dependency value structure"""
    marketplace_plugin_unique_identifier: str  # e.g., "langgenius/openai:0.2.6@hash"


class DifyDependency(BaseModel):
    """Dependency structure"""
    current_identifier: Optional[str] = None
    type: str = "marketplace"
    value: DifyDependencyValue


# =============================================================================
# APP STRUCTURE
# =============================================================================

class DifyApp(BaseModel):
    """App metadata"""
    name: str
    description: str = ""
    icon: str = "🤖"
    icon_background: str = "#FFEAD5"
    mode: str  # workflow, advanced-chat, agent-chat, chat
    use_icon_as_answer_icon: bool = False


# =============================================================================
# COMPLETE DSL STRUCTURE
# =============================================================================

class DifyModelConfig(BaseModel):
    """Model configuration for chat/agent-chat modes"""
    agent_mode: Optional[Dict[str, Any]] = None
    annotation_reply: Optional[Dict[str, Any]] = None
    chat_prompt_config: Optional[Dict[str, Any]] = None
    completion_prompt_config: Optional[Dict[str, Any]] = None
    dataset_configs: Optional[Dict[str, Any]] = None
    dataset_query_variable: Optional[str] = None
    external_data_tools: Optional[List[Any]] = None
    file_upload: Optional[Dict[str, Any]] = None
    model: Optional[Dict[str, Any]] = None
    more_like_this: Optional[Dict[str, Any]] = None
    opening_statement: Optional[str] = None
    pre_prompt: Optional[str] = None
    prompt_config: Optional[Dict[str, Any]] = None
    prompt_type: Optional[str] = None
    retriever_resource: Optional[Dict[str, Any]] = None
    sensitive_word_avoidance: Optional[Dict[str, Any]] = None
    speech_to_text: Optional[Dict[str, Any]] = None
    suggested_questions: Optional[List[str]] = None
    suggested_questions_after_answer: Optional[Dict[str, Any]] = None
    text_to_speech: Optional[Dict[str, Any]] = None
    user_input_form: Optional[List[Dict[str, Any]]] = None

    class Config:
        extra = "allow"


class DifyDSL(BaseModel):
    """
    Complete Dify DSL structure (version 0.4.0)

    This represents the EXACT structure of real Dify exports.
    Supports both workflow modes (with 'workflow' key) and
    chat modes (with 'model_config' key).
    """
    app: DifyApp
    kind: str = "app"
    version: str = "0.4.0"
    dependencies: List[DifyDependency] = Field(default_factory=list)

    # For workflow/advanced-chat modes
    workflow: Optional[DifyWorkflow] = None

    # For chat/agent-chat modes (using alias to avoid Pydantic reserved word)
    model_configuration: Optional[DifyModelConfig] = Field(None, alias="model_config")

    model_config = {"extra": "allow", "populate_by_name": True}
