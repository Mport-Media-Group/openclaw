import { html, nothing } from "lit";
import type { ExecutiveStatusResult } from "../types.ts";

type OverviewExecutiveProps = {
  connected: boolean;
  executiveStatus: ExecutiveStatusResult | null;
  executiveStatusError?: string | null;
};

function readinessLabel(value: boolean): string {
  return value ? "ready" : "needs setup";
}

export function renderOverviewExecutive(props: OverviewExecutiveProps) {
  if (!props.connected && !props.executiveStatus && !props.executiveStatusError) {
    return nothing;
  }
  const status = props.executiveStatus;
  const title =
    status?.identity.workspaceLabel || status?.identity.organizationLabel || "Executive OS";
  return html`
    <div class="card" style="margin-top: 16px;">
      <div class="card-title">${title}</div>
      <div class="card-sub">
        Cloud-first executive control plane for GitHub, Cursor ACP, governance, vault, memory, and
        later browser/DCB surfaces.
      </div>
      ${props.executiveStatusError
        ? html`<div class="muted" style="margin-top: 12px;">${props.executiveStatusError}</div>`
        : nothing}
      ${status
        ? html`
            <div
              style="margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;"
            >
              <div>
                <div class="muted">GitHub</div>
                <div>${status.integrations.github.repository ?? "not configured"}</div>
                <div class="muted">
                  ${readinessLabel(
                    status.integrations.github.tokenPresent &&
                      Boolean(status.integrations.github.repository),
                  )}
                </div>
              </div>
              <div>
                <div class="muted">Cursor ACP</div>
                <div>${status.integrations.cursor.harnessId}</div>
                <div class="muted">${readinessLabel(status.runtimeContract.acpCursorReady)}</div>
              </div>
              <div>
                <div class="muted">Vault</div>
                <div>${status.integrations.vault.provider}</div>
                <div class="muted">${readinessLabel(status.integrations.vault.cliPresent)}</div>
              </div>
              <div>
                <div class="muted">Memory</div>
                <div>${status.integrations.memory.provider}</div>
                <div class="muted">
                  ${readinessLabel(
                    status.integrations.memory.projectUrlPresent &&
                      status.integrations.memory.serviceRolePresent,
                  )}
                </div>
              </div>
              <div>
                <div class="muted">Managed flow</div>
                <div>${status.controller.controllerId ?? "unset"}</div>
                <div class="muted">
                  ${readinessLabel(status.runtimeContract.managedFlowConfigured)}
                </div>
              </div>
              <div>
                <div class="muted">Governance</div>
                <div>${status.governance.roles.length} role(s)</div>
                <div class="muted">
                  ${status.governance.approvalClasses.length} approval classes
                </div>
              </div>
            </div>
            ${status.runtimeContract.notes.length
              ? html`
                  <div style="margin-top: 12px;">
                    <div class="muted">Next executive step</div>
                    <div>${status.runtimeContract.notes[0]}</div>
                  </div>
                `
              : nothing}
            <div style="margin-top: 12px;" class="muted">
              Later surfaces: browser
              ${status.integrations.browser.linkedinDraftsOnly ? "(LinkedIn drafts only)" : ""},
              Canva profile ${status.integrations.browser.canvaProfile}, DCB monitors
              ${status.integrations.dcb.enabled ? "configured" : "staged"}.
            </div>
          `
        : html`
            <div class="muted" style="margin-top: 12px;">
              Executive status becomes available after the executive-ops plugin is enabled.
            </div>
          `}
    </div>
  `;
}
