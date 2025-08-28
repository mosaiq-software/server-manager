import { DeploymentState } from "@mosaiq/nsm-common/types";
export const DeploymentStateIcons = {
    [DeploymentState.READY]: '🔘',
    [DeploymentState.DEPLOYING]: '🟡',
    [DeploymentState.ACTIVE]: '🟢',
    [DeploymentState.FAILED]: '🔴',
    "": '⚫'
}