import * as util from 'util';
import * as child_process from 'child_process';
import {existsSync, readFile} from "fs";
const execAsync = util.promisify(child_process.exec);

export interface HostExecMessage {
    projectId: string;
    instanceId: string;
    command: string;
    cleanup: boolean;
    timeout: number | undefined;
}

export const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const execSafeOnHostWithOutput = async (projectId:string, command:string, timeoutms?: number): Promise<{out: string, code: number}> => {
    let combinedOut = '';
    const messageInstanceId = crypto.randomUUID();
    const message: HostExecMessage = {
        projectId,
        instanceId: messageInstanceId,
        command,
        cleanup: false,
        timeout: timeoutms || undefined
    };
    console.log('Sending command to executor:', message);
    const {out:execOut, code:execCode} = await sendMessageToNsmExecutor(message);
    combinedOut += execOut;
    if (execCode !== 0) {
        combinedOut += `\nError executing command, code ${execCode}`;
        return {out: combinedOut, code: execCode};
    }

    console.log('Waiting for output file from executor...');
    const execOutput = await readExecOutputFile(projectId, messageInstanceId, timeoutms || DEFAULT_TIMEOUT);
    combinedOut += execOutput;

    const cleanupMessage: HostExecMessage = {
        projectId,
        instanceId: messageInstanceId,
        command: '',
        cleanup: true,
        timeout: undefined
    };
    console.log('Sending cleanup command to executor:', cleanupMessage);
    const {out:cleanOut, code:cleanCode} = await sendMessageToNsmExecutor(cleanupMessage);
    combinedOut += cleanOut;
    if (cleanCode !== 0) {
        combinedOut += `\nError cleaning up, code ${cleanCode}`;
        return {out: combinedOut, code: cleanCode};
    }

    return {out: combinedOut, code: 0};
}

const readExecOutputFile = async (projectId:string, instanceId:string, timeoutms: number): Promise<string> => {
    const outWorkingFilePath = `${process.env.NSM_OUTPUT_PATH}/${projectId}/${instanceId}.out.working`;
    const outFilePath = `${process.env.NSM_OUTPUT_PATH}/${projectId}/${instanceId}.out`;

    // read from working file. Clear out its contents. Save to log. Repeat until it becomes just .out. Done
}

const waitForFileExists = async (filePath:string, timeout:number, currentTime:number = 0) => {
    if (existsSync(filePath)) return true;
    if (currentTime >= timeout) return false;
    await new Promise((r) => setTimeout(() => r, 1000));
    return waitForFileExists(filePath, timeout, currentTime + 1000);
}

export const sendMessageToNsmExecutor = async (message: HostExecMessage): Promise<{out: string, code: number}> => {
    const pipePath = process.env.NSM_PIPE_PATH;

    const messageString = JSON.stringify(message).replace(`'`,`"`);

    let out = '';
    try {
        const {out:pipeOut, code:pipeCode} = await execSafe(`echo '${messageString}' > ${pipePath}`);
        out += pipeOut;
        if (pipeCode !== 0) {
            out += `\nError writing to pipe, code ${pipeCode}`;
            return {out, code: pipeCode};
        }
        return {out, code: 0};
    } catch (e:any) {
        out += `\nError executing command: ${e.message}`;
        return {out, code: 1};
    }
};

export const execSafe = async (command:string, timeoutms?:number): Promise<{out: string, code: number}> => {
    let out = '';
    let code = 0;
    try {
        const co = await execAsync(command, { timeout: timeoutms });
        out += `${co.stdout}\n${co.stderr}\n`;
    } catch (error:any) {
        code = error.code ?? 1;
        out += `${error.stdout}\n${error.stderr}\n${error.message}`;
    }
    return { out, code };
}