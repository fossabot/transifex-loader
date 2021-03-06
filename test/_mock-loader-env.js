import path from 'path';
import os from 'os';
import fs from 'mz/fs';
import randomString from 'random-string';

const getMockEnv = async (query = "", generateResource = true, resourceName = "resource", noFiles = false) => {
    let context = "";
    if(!noFiles) {
        context = path.join(os.tmpdir(), `transifex-loader-test-${randomString({
            length: 12
        })}`);

        await fs.mkdir(context);
        await fs.mkdir(path.join(context, '.tx'));

        let txconfig = `[main]
host=https://example.com`;

        if(generateResource) {
            txconfig += `

[mainproject.${resourceName}]
file_filter=<lang>.file
source_lang=source.file`;
        }

        await Promise.all([
            fs.writeFile(path.join(context, '.transifexrc'), `[https://example.com]
username=foo
password=bar
hostname=https://example.com`),
            fs.writeFile(path.join(context, '.tx/config'), txconfig),
            fs.writeFile(path.join(context, 'de.file'), "foo bar")
        ]);
    }
    return {
        _wasSuccessful() {
            if(this._error) {
                throw this._error;
            }
        },
        async() {
            let extractedResolve;
            this._promise = new Promise((resolve, reject) => {
                extractedResolve = (error, result) => {
                    if(error) {
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                };
            });
            return extractedResolve;
        },
        cacheable(isCacheable) {
            this._cacheable = isCacheable;
        },
        resourcePath: path.join(context, 'de.file'),
        context,
        query,
        _dependencies: [],
        addDependency(dep) {
            this._dependencies.push(dep);
        },
        emitError(error) {
            this._error = error;
        },
        emitWarning(warning) {
            this._warning = warning;
        }
    };
};

const cleanUpMockEnv = async (mockEnv) => {
    await Promise.all([
        fs.unlink(path.join(mockEnv.context, '.tx/config')),
        fs.unlink(path.join(mockEnv.context, '.transifexrc')),
        fs.unlink(mockEnv.resourcePath)
    ]);

    await fs.rmdir(path.join(mockEnv.context, '.tx'));
    await fs.rmdir(mockEnv.context);
};

export {
    getMockEnv, cleanUpMockEnv
};
