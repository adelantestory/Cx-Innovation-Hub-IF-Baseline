COPILOT_CONFIG_DIR="/workspaces/demo-playwright/.copilot-config"

# Create project-local copilot config directory
mkdir -p "$COPILOT_CONFIG_DIR"

# Seed an empty MCP config if one doesn't exist yet
if [ ! -f "$COPILOT_CONFIG_DIR/mcp-config.json" ]; then
    echo '{}' > "$COPILOT_CONFIG_DIR/mcp-config.json"
fi

# Point copilot CLI at the project-local config dir
if ! grep -q 'COPILOT_CONFIG_DIR=' ~/.bashrc; then
    echo "export COPILOT_CONFIG_DIR=\"$COPILOT_CONFIG_DIR\"" >> ~/.bashrc
fi

# Set alias so --config-dir is always applied
if ! grep -q 'alias copilot=' ~/.bashrc; then
    echo "alias copilot='copilot --config-dir \"$COPILOT_CONFIG_DIR\"'" >> ~/.bashrc
fi