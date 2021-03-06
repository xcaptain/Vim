import * as vscode from 'vscode';

import { Configuration } from '../configuration/configuration';
import { Neovim } from '../neovim/nvimUtil';
import { VimState } from '../state/vimState';
import { StatusBar } from '../statusBar';
import * as parser from './parser';
import * as util from '../util';
import { VimError, ErrorCode } from '../error';

export class CommandLine {
  public static async PromptAndRun(initialText: string, vimState: VimState): Promise<void> {
    if (!vscode.window.activeTextEditor) {
      console.log('CommandLine: No active document.');
      return;
    }

    let cmd = await vscode.window.showInputBox(this.getInputBoxOptions(initialText));
    if (cmd && cmd[0] === ':' && Configuration.cmdLineInitialColon) {
      cmd = cmd.slice(1);
    }

    await CommandLine.Run(cmd!, vimState);
  }

  public static async Run(command: string, vimState: VimState): Promise<void> {
    if (!command || command.length === 0) {
      return;
    }

    try {
      const cmd = parser.parse(command);
      const useNeovim = Configuration.enableNeovim && cmd.command && cmd.command.neovimCapable;

      if (useNeovim) {
        await Neovim.command(vimState, command);
      } else {
        await cmd.execute(vimState.editor, vimState);
      }
    } catch (e) {
      console.log(e);
      if (e instanceof VimError) {
        StatusBar.SetText(`${e.toString()}. ${command}`, vimState.currentMode, true);
      } else {
        util.showError(e.toString());
      }
    }
  }

  private static getInputBoxOptions(text: string): vscode.InputBoxOptions {
    return {
      prompt: 'Vim command line',
      value: Configuration.cmdLineInitialColon ? ':' + text : text,
      ignoreFocusOut: false,
      valueSelection: [
        Configuration.cmdLineInitialColon ? text.length + 1 : text.length,
        Configuration.cmdLineInitialColon ? text.length + 1 : text.length,
      ],
    };
  }
}
