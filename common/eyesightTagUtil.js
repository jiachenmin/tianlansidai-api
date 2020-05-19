// 远视储备 年龄与视力数值的对应关系
const distantVisionReserve = {
    "3": 2.50,
    "4": 2.25,
    "5": 2.00,
    "6": 1.50,
    "7": 1.25,
    "8": 1.00,
    "9": 0.75,
    "10": 0.50
}
function _doCalculateSingleEye (record, type) {
    var luoshi = parseFloat(record["裸视LUOSHI_" + type]);
    var value = record["等效球镜远视力储备_" + type];
    var value_1 = record["等效球镜度数_" + type];
    if (luoshi >= 1.0) {
        if (value >= 4.0) {
            record["标签_" + type] = "A01"
        } else if (value > -0.5 && value < 4.0) {
            if (value_1 >= 4.0) {
                record["标签_" + type] = "A01"
            } else {
                record["标签_" + type] = "A02"
            }
        } else if (value >= -1.0 && value <= -0.5) {
            record["标签_" + type] = "A03"
        } else if (value > -1.25 && value < -1.0) {
            record["标签_" + type] = "A03"
        } else if (value >= -3.0 && value <= -1.25) {
            record["标签_" + type] = "A04"
        } else if (value < -3.0) {
            record["标签_" + type] = "A05"
        } else {
            record["标签_" + type] = "B01";
        }
    } else if (luoshi == 0.8) {
        if (value_1 > 4.0) {
            record["标签_" + type] = "A07"
        } else if (value_1 >= -0.5 && value_1 <= 4.0) {
            record["标签_" + type] = "A06"
        } else if (value_1 < -0.5) {
            record["标签_" + type] = "A06"
        } else {
            record["标签_" + type] = "B03";
        }
    } else if (luoshi >= 0.4 && luoshi <= 0.6) {
        if (value_1 > 4.0) {
            record["标签_" + type] = "A07"
        } else if (value_1 >= -0.5 && value_1 <= 4.0) {
            record["标签_" + type] = "A08"
        } else if (value_1 < -0.5) {
            record["标签_" + type] = "A08"
        } else {
            record["标签_" + type] = "B05";
        }
    } else if (luoshi <= 0.3) {
        if (value_1 > 4.0) {
            record["标签_" + type] = "A07"
        } else if (value_1 >= -0.5 && value_1 <= 4.0) {
            record["标签_" + type] = "A09"
        } else if (value_1 >= -6.0 && value_1 < -0.5) {
            record["标签_" + type] = "A10"
        } else if (value_1 < -6.0) {
            record["标签_" + type] = "A11"
        } else {
            record["标签_" + type] = "B07";
        }
    } else {
        record["标签_" + type] = "B01";
    }
    return record;
}
function setTag (record) {
    // 1.计算“等效球镜度数”
    record["等效球镜度数_L"] = parseFloat(record["屈光QUGUANG_L"]) + parseFloat(record["散光SANGUANG_L"]) / 2
    record["等效球镜度数_R"] = parseFloat(record["屈光QUGUANG_R"]) + parseFloat(record["散光SANGUANG_R"]) / 2
    // 2.计算“等效球镜远视力储备”
    record["等效球镜远视力储备_L"] = parseFloat(record["等效球镜度数_L"]) - (distantVisionReserve[record["学生年龄"]] ? distantVisionReserve[record["学生年龄"]] : 0)
    record["等效球镜远视力储备_R"] = parseFloat(record["等效球镜度数_R"]) - (distantVisionReserve[record["学生年龄"]] ? distantVisionReserve[record["学生年龄"]] : 0)
    // 3.为左眼打标签
    record = _doCalculateSingleEye(record, "L");
    // 4.为右眼打标签
    record = _doCalculateSingleEye(record, "R");
    return record;
}

module.exports = { setTag }