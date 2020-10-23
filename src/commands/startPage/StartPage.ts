/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as vscode from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { localize } from '../../localize';
import { cryptoUtils } from '../../utils/cryptoUtils';

type WebviewMessage = { command: string, [key: string]: string };

interface StartPageContext {
    cspSource: string;
    nonce: string;
    codiconsFontUri: string;
    codiconsStyleUri: string;
    dockerIconUri: string;
    showStartPageChecked: 'checked' | '';
}

class StartPage {
    private activePanel: vscode.WebviewPanel | undefined;

    public async createOrShow(context: IActionContext): Promise<void> {
        const resourcesRoot = vscode.Uri.joinPath(ext.context.extensionUri, 'resources');
        const codiconsRoot = vscode.Uri.joinPath(ext.context.extensionUri, 'node_modules', 'vscode-codicons', 'dist');

        if (!this.activePanel) {
            this.activePanel = vscode.window.createWebviewPanel(
                'vscode-docker.startPage',
                localize('vscode-docker.help.startPage.title', 'Docker - Get Started'),
                vscode.ViewColumn.One,
                {
                    enableCommandUris: true,
                    enableScripts: true,
                    localResourceRoots: [resourcesRoot, codiconsRoot],
                }
            );

            const listener = this.activePanel.webview.onDidReceiveMessage(async (message: WebviewMessage) => this.handleMessage(message));

            this.activePanel.onDidDispose(() => {
                this.activePanel = undefined;
                listener.dispose();
            });
        }

        this.activePanel.webview.html = await this.getWebviewHtml(resourcesRoot, codiconsRoot);
        this.activePanel.reveal();
    }

    private async getWebviewHtml(resourcesRoot: vscode.Uri, codiconsRoot: vscode.Uri): Promise<string> {
        const Handlebars = await import('handlebars');
        const webview = this.activePanel.webview;
        const templatePath = vscode.Uri.joinPath(resourcesRoot, 'startPage.html.template');

        const startPageContext: StartPageContext = {
            cspSource: webview.cspSource,
            nonce: cryptoUtils.getRandomHexString(8),
            codiconsFontUri: webview.asWebviewUri(vscode.Uri.joinPath(codiconsRoot, 'codicon.ttf')).toString(),
            codiconsStyleUri: webview.asWebviewUri(vscode.Uri.joinPath(codiconsRoot, 'codicon.css')).toString(),
            dockerIconUri: webview.asWebviewUri(vscode.Uri.joinPath(resourcesRoot, 'docker.png')).toString(),
            showStartPageChecked: vscode.workspace.getConfiguration('docker').get('showStartPage', false) ? 'checked' : '',
        };

        const template = Handlebars.compile(await fse.readFile(templatePath.fsPath, 'utf-8'));
        return template(startPageContext);
    }

    private async handleMessage(message: WebviewMessage): Promise<void> {
        switch (message.command) {
            case 'showStartPageClicked':
                await vscode.workspace.getConfiguration('docker').update('showStartPage', Boolean(message.showStartPage), vscode.ConfigurationTarget.Global);
                break;
            default:
        }
    }
}

export const startPage = new StartPage();