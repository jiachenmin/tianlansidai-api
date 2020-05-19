function prefixZero(num, n) {
    return (Array(n).join(0) + num).slice(-n);
}
function str16ToStr64(str) {
    const array = [
        '#', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '.',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', '~', 'm', 'n', '_', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', '=', 'J', 'K', 'L', 'M', 'N', '-', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ]
    // 将16进制字符传转换为二进制字符串
    let binaryStr = '';
    for (let i = 0; i < str.length; i++) {
        let char = parseInt(str[i], 16).toString(2) + ""
        char = prefixZero(char, 4)
        binaryStr += char;
    }
    // 将二进制字符串切割为16进制数组，即6个二进制字符为一组
    let arrayGroup64 = []
    for (let i = 0, len = binaryStr.length; i < len; i += 6) {
        arrayGroup64.push(binaryStr.slice(i, i + 6));
    }
    // 将64进制数组转换为64进制字符串
    let str64 = ""
    arrayGroup64.forEach((e, i) => {
        const value = parseInt(Array(e).join(''), 2);
        str64 += array[value]
    })
    return str64
}
function getInfoFromObjectId(str) {
    let binaryStr = '';
    for (let i = 0; i < str.length; i++) {
        let char = str[i] + ""
        binaryStr += char;
    }
    const timeArray = binaryStr.slice(0, 8)
    const machineIdArray = binaryStr.slice(8, 14)
    const pidArray = binaryStr.slice(14, 18)
    const seqArray = binaryStr.slice(18, 24)
    console.log(str,seqArray,parseInt(Array(seqArray).join(''), 16))
    return {
        time: parseInt(Array(timeArray).join(''), 16),
        machineId: parseInt(Array(machineIdArray).join(''), 16),
        pid: parseInt(Array(pidArray).join(''), 16),
        seq: prefixZero(parseInt(Array(seqArray).join(''), 16),8)
    }
}



module.exports = {
    prefixZero, str16ToStr64, getInfoFromObjectId
}