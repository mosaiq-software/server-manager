import * as util from 'util';
import * as child_process from 'child_process';
const exec = util.promisify(child_process.exec);
export const executeCommandOnHost = async (command: string): Promise<string | undefined> => {
    const pipePath = process.env.NSM_PIPE_PATH;
    try {
        const {stdout, stderr} = await exec(`echo "${command}" > ${pipePath}`);
        if (stderr) {
            console.error(`Error executing command on host: ${stderr}`);
            return undefined;
        }
    } catch (e) {
        console.error(`Error executing command on host: ${e}`);
        return "Node Error executing command on host";
    }

    const stdoutDump = process.env.NSM_OUTPUT_PATH;
    try {
        const {stdout, stderr} = await exec(`cat ${stdoutDump}`);
        if (stderr) {
            console.error(`Error reading command output: ${stderr}`);
            return undefined;
        }
        return stdout;
    } catch (e) {
        console.error(`Error reading command output: ${e}`);
        return "Node Error reading command output";
    }
};
