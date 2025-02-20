# @waldzellai/mcp-servers

[![smithery badge](https://smithery.ai/badge/@waldzellai/mcp-servers)](https://smithery.ai/server/@waldzellai/mcp-servers)

A collection of Model Context Protocol (MCP) servers providing various capabilities for AI assistants.

## Packages

### [@waldzellai/clear-thought](packages/server-clear-thought)
An MCP server providing advanced problem-solving capabilities through:
- Sequential thinking with dynamic thought evolution
- Mental models for structured problem decomposition [from a list provided by James Clear's website](https://jamesclear.com/mental-models)
- Systematic debugging approaches

## Development

This is a monorepo using npm workspaces. To get started:

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Clean all packages
npm run clean

# Test all packages
npm run test
```

## Package Management

Each package in the `packages/` directory is published independently to npm under the `@waldzellai` organization scope.

To create a new package:
1. Create a new directory under `packages/`
2. Initialize with required files (package.json, src/, etc.)
3. Add to workspaces in root package.json if needed

## License
MIT

## Understanding MCP Model Enhancement

### Less Technical Answer 

Here's a reframed explanation using USB/hardware analogies:

#### Model Enhancement as USB Add-Ons  
Think of the core AI model as a basic desktop computer. Model enhancement through MCP is like adding specialized USB devices to expand its capabilities. The Sequential Thinking server acts like a plug-in math coprocessor chip (like old 8087 FPU chips) that boosts the computer's number-crunching abilities.

**How USB-Style Enhancement Works:**

##### Basic Setup
- **Desktop (Base AI Model)**: Handles general tasks  
- **USB Port (MCP Interface)**: Standard connection point  
- **USB Stick (MCP Server)**: Contains special tools (like a "math helper" program)

##### Plug-and-Play Mechanics  
1. **Driver Installation (Server Registration)**  
   ```python
   # Simplified version of USB "driver setup"
   def install_mcp_server(usb_port, server_files):
       usb_port.register_tools(server_files['tools'])
       usb_port.load_drivers(server_files['drivers'])
   ```
   - Server provides "driver" APIs the desktop understands  
   - Tools get added to the system tray (available services)

2. **Tool Execution (Using the USB)**  
   - Desktop sends request like a keyboard input:  
   `Press F1 to use math helper`  
   - USB processes request using its dedicated hardware:  
   ```python
   def math_helper(input):
       # Dedicated circuit on USB processes this
       return calculation_results
   ```
   - Results return through USB cable (MCP protocol)

##### Real-World Workflow  
1. User asks AI to solve complex equation  
2. Desktop (base AI) checks its "USB ports":  
   - `if problem == "hard_math":`  
   - `    use USB_MATH_SERVER`  
3. USB math server returns:  
   - Step-by-step solution  
   - Confidence score (like error margins)  
   - Alternative approaches (different "calculation modes")

#### Why This Analogy Works  
- **Hot-swapping**: Change USB tools while system runs  
- **Specialization**: Different USBs for math/code/art  
- **Resource Limits**: Complex work offloaded to USB hardware  
- **Standard Interface**: All USBs use same port shape (MCP protocol)  

Just like you might use a USB security dongle for protected software, MCP lets AI models temporarily "borrow" specialized brains for tough problems, then return to normal operation.

### More Technical Answer

Model enhancement in the context of the Model Context Protocol (MCP) refers to improving AI capabilities through structured integration of external reasoning tools and data sources. The Sequential Thinking MCP Server demonstrates this by adding dynamic problem-solving layers to foundational models like Claude 3.5 Sonnet.

**Mechanics of Reasoning Component Delivery:**

#### Server-Side Implementation
MCP servers expose reasoning components through:
1. **Tool registration** - Servers define executable functions with input/output schemas:
```java
// Java server configuration example
syncServer.addTool(syncToolRegistration);
syncServer.addResource(syncResourceRegistration);
```
2. **Capability negotiation** - During initialization, servers advertise available components through protocol handshakes:
- Protocol version compatibility checks
- Resource availability declarations
- Supported operation listings

3. **Request handling** - Servers process JSON-RPC messages containing:
- Component identifiers
- Parameter payloads
- Execution context metadata

#### Client-Side Interaction
MCP clients discover and utilize reasoning components through:
1. **Component discovery** via `list_tools` requests:
```python
# Python client example
response = await self.session.list_tools()
tools = response.tools
```
2. **Dynamic invocation** using standardized message formats:
- Request messages specify target component and parameters
- Notifications stream intermediate results
- Errors propagate with structured codes

3. **Context maintenance** through session persistence:
- Conversation history tracking
- Resource handle caching
- Partial result aggregation

#### Protocol Execution Flow
The component delivery process follows strict sequencing:
1. **Connection establishment**
   - TCP/HTTP handshake
   - Capability exchange (server ↔ client)
   - Security context negotiation

2. **Component resolution**
   - Client selects appropriate tool from server registry
   - Parameter validation against schema
   - Resource binding (e.g., database connections)

3. **Execution lifecycle**
   - Request: Client → Server (JSON-RPC)
   - Processing: Server → Tool runtime
   - Response: Server → Client (structured JSON)

Modern implementations like Rhino's Grasshopper integration demonstrate real-world mechanics:
```python
# Rhino MCP server command processing
Rhino.RhinoApp.InvokeOnUiThread(lambda: process_command(cmd))
response = get_response() # Capture Grasshopper outputs
writer.WriteLine(response) # Return structured results
```

This architecture enables dynamic enhancement of AI capabilities through:
- **Pluggable reasoning modules** (add/remove without system restart)
- **Cross-platform interoperability** (Python ↔ Java ↔ C# components)
- **Progressive disclosure** of complex functionality
- **Versioned capabilities** for backward compatibility

The protocol's transport-agnostic design ensures consistent component delivery across:
- Local stdio processes
- HTTP/SSE cloud endpoints
- Custom binary protocols
- Hybrid edge computing setups
