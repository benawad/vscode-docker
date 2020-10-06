import * as vscode from 'vscode';
import { AzExtParentTreeItem } from "vscode-azureextensionui";
import { DockerUri } from '../../../docker/files/dockerUri';
import { DirectoryTreeItem } from "./DirectoryTreeItem";

export class FilesTreeItem extends DirectoryTreeItem {
    public constructor(parent: AzExtParentTreeItem, fs: vscode.FileSystem, containerId: string) {
        super(parent, fs, 'Files', DockerUri.create(containerId, '/', 'directory'));
    }

    public get contextValue(): string {
        return '';
    }

    public get iconPath(): vscode.ThemeIcon {
        return new vscode.ThemeIcon('files');
    }
}