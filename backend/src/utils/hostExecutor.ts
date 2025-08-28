import {execSync} from "child_process";

export const executeCommandOnHost = (command: string): string | undefined => {
    const pipePath = process.env.NSM_PIPE_PATH;
    try {
        execSync(`echo "${command}" > ${pipePath}`);
    } catch (e) {
        console.error(`Error executing command on host: ${e}`);
        return undefined;
    }

    const stdoutDump = process.env.NSM_OUTPUT_PATH;
    try {
        const stdout = execSync(`cat ${stdoutDump}`).toString();
        return stdout;
    } catch (e) {
        console.error(`Error reading command output: ${e}`);
        return undefined;
    }
};