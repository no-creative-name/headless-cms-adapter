import { IContentData } from "../../interfaces/content";

export const deepSet = (object: any, propertyArray: string[], value: any): any => {
    const objectCopy = Object.assign({}, object);

    if (!object) {
        throw new Error(`Couldn't set value for ${propertyArray.toString()}: object is undefined`);
    }
    if (!propertyArray) {
        throw new Error(`Couldn't set value in object: property array is undefined`);
    }
    if (value === undefined) {
        throw new Error(`Couldn't set value for ${propertyArray.toString()} in object: value is undefined`);
    }

    let currentLevel = objectCopy;
    let goDeeper = true;
    let restProperties;

    // find master object level on where the next property of the array does not exist yet
    propertyArray.forEach((property: string, index: number) => {
        if (goDeeper) {
            if (!currentLevel[property]) {
                restProperties = propertyArray.slice(index);
                goDeeper = false;
            } else {
                currentLevel = currentLevel[property] || undefined;
            }
        }
    });

    // create object to insert into that level of master object
    let dataToInsert = {};
    const reversedRestProperties = [...restProperties].reverse();

    reversedRestProperties.map((prop, index) => {
        const propObj = {};
        if (index === 0) {
            propObj[prop] = value;
            dataToInsert = propObj;
        } else if (index < reversedRestProperties.length - 1) {
            propObj[prop] = dataToInsert;
            dataToInsert = propObj;
        }
    });

    // insert new object into master object
    if (currentLevel[restProperties[0]] !== undefined) {
        // tslint:disable-next-line
        console.warn(`Deep set: Overwritten existing property ${restProperties[0]} in object`);
    }
    if (restProperties.length === 1) {
        currentLevel[restProperties[0]] = dataToInsert[restProperties[0]];
    } else {
        currentLevel[restProperties[0]] = dataToInsert;
    }

    return objectCopy;
};

export const deepSetToFields = (fieldObject: IContentData, propertyArray: string[], value: any) => {
    const correctKey = Object.keys(fieldObject).find((key) => key === propertyArray[0]);

    if (correctKey) {
        if (propertyArray.slice(1).length > 0) {
            return Object.assign(fieldObject, {[correctKey]: {
                fieldType: fieldObject[correctKey].fieldType,
                value: deepSet(fieldObject[correctKey].value, propertyArray.slice(1), value),
            }});
        } else {
            return Object.assign(fieldObject, {[correctKey]: {
                fieldType: fieldObject[correctKey].fieldType,
                value,
            }});
        }
    } else {
        if (propertyArray.slice(1).length > 0) {
            return Object.assign(fieldObject, {[propertyArray[0]]: {
                fieldType: undefined,
                value: deepSet({}, propertyArray.slice(1), value),
            }});
        } else {
            return Object.assign(fieldObject, {[propertyArray[0]]: {
                fieldType: undefined,
                value,
            }});
        }
    }
};
