import asyncio
import os
from pydantic import AnyUrl

from mcp import ClientSession, StdioServerParameters, types
from mcp.client.stdio import stdio_client

async def run_dify_workflow(dify_server_command: list[str], dsl_content: str) -> str:
    """
    Connects to a Dify MCP server, sends a DSL workflow for execution,
    and returns the result.
    """
    command = dify_server_command[0]
    args = dify_server_command[1:]

    server_params = StdioServerParameters(
        command=command,
        args=args,
        env=os.environ.copy(),
    )

    result_text = ""

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()

                # Assuming the Dify server has a tool named 'run_dsl_workflow'
                # that accepts the DSL content as an argument.
                result = await session.call_tool(
                    "run_dsl_workflow",
                    arguments={"dsl": dsl_content}
                )

                if result.isError:
                    result_text = f"Error executing workflow: {result.content}"
                else:
                    for content_block in result.content:
                        if isinstance(content_block, types.TextContent):
                            result_text += content_block.text
                    if not result_text:
                        result_text = "Workflow executed, but no text output was returned."

    except Exception as e:
        result_text = f"An error occurred while communicating with the Dify MCP server: {e}"

    return result_text