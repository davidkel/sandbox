import * as fs from 'fs-extra';
import * as path from 'path';
import {Package} from 'fabric-client';

export class CDS {
  private readonly directoriesAndFilesForPackage: (string | string[])[];
  private readonly ignored: string[] = ['node_modules', '.map'];

  public constructor(private readonly tmpDir: string,
                     private readonly argv: any) {
    this.directoriesAndFilesForPackage = [
      'smart-contract',
      [
        'smart-contract/META-INF/',
        './metadata'
      ],
      'shared-network',
      [
        'shared-network/app/to-be-packaged/META-INF/',
        './metadata'
      ],
    ];
  }

  public async build(): Promise<void> {
    const temporaryContractDirectory = await this.copyContentsToTemporaryLocation();

    const contractPackageJSON = await this.readContractPackageJSON(temporaryContractDirectory);
    await this.buildPackageJSON(temporaryContractDirectory, contractPackageJSON);
    console.log(`Building CDS (${temporaryContractDirectory})`);
    const cdsFileLocation = await this.buildCDS(temporaryContractDirectory, contractPackageJSON);
    console.log(`Chaincode packaged. Saved to ${cdsFileLocation}`);

    console.log(`Deleting temporary directory... ${temporaryContractDirectory}`);
    await this.deleteDirectory(temporaryContractDirectory);
  }

  private async copyContentsToTemporaryLocation(): Promise<string> {
    const temporaryContractDirectory = path.join(this.tmpDir, `wet-contract-${Date.now()}`);

    for (const dir of this.directoriesAndFilesForPackage) {
      if (Array.isArray(dir)) {
        const tmpLocation = path.join(temporaryContractDirectory, dir[1]);
        await this.copy(path.join(this.argv.source, dir[0]), tmpLocation);
      } else {
        const tmpLocation = path.join(temporaryContractDirectory, dir);
        await this.copy(path.join(this.argv.source, dir), tmpLocation);
      }
    }

    return temporaryContractDirectory;
  }

  private async copy(source: string, destination: string): Promise<void> {
    const exists = await fs.pathExists(source);
    const stats = exists && await fs.stat(source);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
      await fs.mkdirp(destination);
      const sourceDirectoryContents = await fs.readdir(source);

      for (const file of sourceDirectoryContents) {
        const filePath = path.join(source, file);

        const shouldFileOrDirectoryBeIgnored = this.ignored.some((toBeIgnored) => {
          return path.basename(filePath).endsWith(toBeIgnored);
        });

        if (!shouldFileOrDirectoryBeIgnored) {
          await this.copy(filePath, path.join(destination, file));
        }
      }
    } else if (source.endsWith('package.json')) {
      const packageJSONToCopy = JSON.parse((await fs.readFile(source)).toString());
      const newPackageJSON = {
        name: packageJSONToCopy.name,
        version: packageJSONToCopy.version,
        description: packageJSONToCopy.description,
        dependencies: packageJSONToCopy.dependencies
      };

      await fs.writeFile(destination, JSON.stringify(newPackageJSON));
    } else {
      await fs.copy(source, destination);
    }
  }

  private async buildCDS(temporaryContractDirectory: string, contractPackageJSON: { name: string, version: string }): Promise<string> {
    const version = this.argv.contractVersion || contractPackageJSON.version;

    const contractPackage = await Package.fromDirectory({
      name: contractPackageJSON.name,
      version: version,
      path: temporaryContractDirectory,
      type: 'node',
      metadataPath: temporaryContractDirectory + '/metadata'
    });

    const destination = path.join(this.argv.destination, `${this.argv.contractName}@${version}.cds`);

    await fs.writeFile(destination, await contractPackage.toBuffer());

    return destination;
  }

  private async readContractPackageJSON(temporaryContractDirectory: string): Promise<any> {
    const fileName = path.join(temporaryContractDirectory, 'smart-contract/package.json');
    const file = await fs.readFile(fileName);

    return JSON.parse(file.toString());
  }

  private async buildPackageJSON(temporaryContractDirectory: string, contractPackageJSON: { name: string, version: string }): Promise<void> {
    const content: any = {
      name: contractPackageJSON.name,
      version: this.argv.version || contractPackageJSON.version,
      scripts: {
        start: 'node smart-contract/index.js',
      },
      dependencies: {
        'smart-contract': 'file:smart-contract'
      }
    };

    if (this.argv.invokeHandler) {
      content.invokeHandler = 'FtInvokeHandler';
    }

    const packageJSONLocation = path.join(temporaryContractDirectory, 'package.json');
    await fs.writeFile(packageJSONLocation, JSON.stringify(content, null, '   '));
  }

  private async deleteDirectory(directoryToDelete: string): Promise<any> {
    if (!await fs.pathExists(directoryToDelete)) {
      return;
    }

    for (const file of await fs.readdir(directoryToDelete)) {
      const currentPath = path.join(directoryToDelete, file);

      if ((await fs.lstat(currentPath)).isDirectory()) {
        await this.deleteDirectory(currentPath);
      } else {
        await fs.unlink(currentPath);
      }
    }

    await fs.rmdir(directoryToDelete);
  }
}
