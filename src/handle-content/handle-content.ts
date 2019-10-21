import { Content } from "../interfaces/content";
import { ContentHandler } from "../interfaces/content-handler";
import { ContentConfig } from "../interfaces/adapter-config";

export const handleContent: ContentHandler = (content: Content, contentConfigs: ContentConfig[]): Content => {
    if(!content || !contentConfigs) {
        throw new Error('Input is invalid.');
    }
    let handledContent = JSON.parse(JSON.stringify(content));
    contentConfigs.forEach(contentConfig => {
        handledContent = adjustContentToConfig(handledContent, contentConfig)}
    )
    return handledContent;
};

export const adjustContentToConfig = (input: Content, contentConfig: ContentConfig): Content => {
    let adjusted: Content = JSON.parse(JSON.stringify(input));

    if(adjusted.type === contentConfig.inputType && contentConfig.parameterAdjustments) {
        contentConfig.parameterAdjustments.map(parameterAdjustment => {
            let value;
            if(Array.isArray(parameterAdjustment.inputIdentifier)) {
                value = deepGet(adjusted.data, parameterAdjustment.inputIdentifier);
                adjusted.data = deepRemove(adjusted.data, parameterAdjustment.inputIdentifier);
            }
            else {
                value = deepGet(adjusted.data, [parameterAdjustment.inputIdentifier]);
                adjusted.data = deepRemove(adjusted.data, [parameterAdjustment.inputIdentifier]);
            }

            if(Array.isArray(parameterAdjustment.outputIdentifier)) {
                adjusted.data = deepSet(adjusted.data, parameterAdjustment.outputIdentifier, value);
            }
            else {
                adjusted.data = deepSet(adjusted.data, [parameterAdjustment.outputIdentifier], value);
            }
        });
    }    
    let output: Content = {
        type: '',
        data: {}
    };

    if(!adjusted.data || !adjusted.type) {
        return adjusted;
    }
    
    Object.keys(adjusted.data || {}).forEach(key => {
        if(Array.isArray(adjusted.data[key])) {
            output.data[key] = adjusted.data[key].map(dataParameter => adjustContentToConfig(dataParameter, contentConfig));
        }
        else if(typeof adjusted.data[key] === 'object') {
            output.data[key] = adjustContentToConfig(adjusted.data[key], contentConfig);
        }
        else {
           output.data[key] = adjusted.data[key];
        }
    });
    
    if(adjusted.type) {
        if(adjusted.type === contentConfig.inputType) {
            if(contentConfig.outputType) {
                output.type = contentConfig.outputType;
            }
        }
        else {
            output.type = adjusted.type;
        }
    }
    return output;
}

export const deepGet = (object: any, parameterArray: string[]): any => {
    if(!object) {
        throw new Error(`Couldn't get value for ${parameterArray.toString()}: object is undefined`);
    }
    if(!parameterArray) {
        throw new Error(`Couldn't get value in ${JSON.stringify(object)}: parameter array is undefined`);
    }

    let value = object;
    parameterArray.forEach(parameter => {
        value = value[parameter] || undefined;
    });
    return value;
}

export const deepSet = (object: any, parameterArray: string[], value: any): any => {
    const objectCopy = JSON.parse(JSON.stringify(object));
    
    if(!object) {
        throw new Error(`Couldn't set value for ${parameterArray.toString()}: object is undefined`);
    }
    if(!parameterArray) {
        throw new Error(`Couldn't set value in ${JSON.stringify(object)}: parameter array is undefined`);
    }
    if(!value) {
        throw new Error(`Couldn't set value for ${parameterArray.toString()} in ${JSON.stringify(object)}: value is undefined`);
    }

    let currentLevel = objectCopy;
    let goDeeper = true;
    let restParameters;
    
    // find master object level on where the next parameter of the array does not exist yet
    parameterArray.forEach((parameter: string, index: number) => {
        if(goDeeper) {
            if(!currentLevel[parameter]) {
                restParameters = parameterArray.slice(index);
                goDeeper = false;
            }
            else {
                currentLevel = currentLevel[parameter] || undefined;
            }
        }
    });
    
    // create object to insert into that level of master object
    let dataToInsert = {};
    const reversedRestParameters = [...restParameters].reverse();
    
    reversedRestParameters.map((param, index) => {
        let paramObj = {};
        if(index === 0) {
            paramObj[param] = value;
            dataToInsert = paramObj;
        }
        else if (index < reversedRestParameters.length - 1) {
            paramObj[param] = dataToInsert;
            dataToInsert = paramObj;
        }
    });
    
    // insert new object into master object
    if(currentLevel[restParameters[0]] !== undefined) {
        throw new Error(`Deep set failed: tried to overwrite existing parameter ${restParameters[0]} in ${objectCopy}`)
    }
    if(restParameters.length === 1) {
        currentLevel[restParameters[0]] = dataToInsert[restParameters[0]];
    }
    else {
        currentLevel[restParameters[0]] = dataToInsert;
    }
    
    return objectCopy;
}

export const deepRemove = (object: any, parameterArray: string[]): any => {
    const objectCopy = JSON.parse(JSON.stringify(object));

    if(!object) {
        throw new Error(`Couldn't get value for ${parameterArray.toString()}: object is undefined`);
    }
    if(!parameterArray) {
        throw new Error(`Couldn't get value in ${JSON.stringify(object)}: parameter array is undefined`);
    }

    let value = objectCopy;
    parameterArray.forEach((parameter: string, index: number) => {
        if(index === parameterArray.length - 1 && value[parameter]) {
            delete value[parameter];
        }
        else if(value[parameter]) {
            value = value[parameter];
        }
    });
    return objectCopy;
}