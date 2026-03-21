import { Show, createEffect, createSignal, type Component } from "solid-js"
import { RefreshCw } from "lucide-solid"
import { serverApi } from "../../../../../lib/api-client"
import { ansiToHtml } from "../../../../../lib/ansi"

interface GitGraphTabProps {
  t: (key: string, vars?: Record<string, any>) => string
  instanceId: string
}

const GitGraphTab: Component<GitGraphTabProps> = (props) => {
  const [graphHtml, setGraphHtml] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const loadGraph = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await serverApi.fetchGitGraph(props.instanceId)
      setGraphHtml(ansiToHtml(response.graph))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load git graph")
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    void loadGraph()
  })

  return (
    <div class="flex flex-col h-full">
      <div class="files-tab-header flex items-center justify-between p-2 border-b border-border">
        <span class="text-sm font-medium">Git Graph</span>
        <button
          type="button"
          class="files-header-icon-button"
          title={props.t("instanceShell.rightPanel.actions.refresh")}
          aria-label={props.t("instanceShell.rightPanel.actions.refresh")}
          disabled={loading()}
          onClick={() => void loadGraph()}
        >
          <RefreshCw class={`h-4 w-4${loading() ? " animate-spin" : ""}`} />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-4 bg-surface-elevated">
        <Show when={loading() && !graphHtml()}>
          <div class="text-secondary text-sm">Loading graph...</div>
        </Show>
        <Show when={error()}>
          <div class="text-error text-sm">{error()}</div>
        </Show>
        <Show when={graphHtml()}>
          <pre
            class="text-xs font-mono whitespace-pre-wrap break-words"
            innerHTML={graphHtml()!}
            style={{ "line-height": "1.2" }}
          />
        </Show>
      </div>
    </div>
  )
}

export default GitGraphTab
