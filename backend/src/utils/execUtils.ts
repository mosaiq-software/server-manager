import * as util from 'util';
import * as child_process from 'child_process';
const execAsync = util.promisify(child_process.exec);


export const execSafeOnHost = async (command: string, timeoutmsX2?: number): Promise<{out: string, code: number}> => {
    const pipePath = process.env.NSM_PIPE_PATH;
    const stdoutDump = process.env.NSM_OUTPUT_PATH;
    let out = '';
    try {
        const {out:pipeOut, code:pipeCode} = await execSafe(`echo "${command}" > ${pipePath}`, timeoutmsX2);
        out += pipeOut;
        if (pipeCode !== 0) {
            out += `\nError writing to pipe, code ${pipeCode}`;
            return {out, code: pipeCode};
        }
        const {out:catOut, code:catCode} = await execSafe(`cat ${stdoutDump}`, timeoutmsX2);
        out += catOut;
        if (catCode !== 0) {
            out += `\nError reading command output, code ${catCode}`;
            return {out, code: catCode};
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