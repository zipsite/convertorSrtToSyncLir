import readline from 'readline';
import fs from 'fs';


const lineReader = readline.createInterface({
  input: fs.createReadStream('this_song_is_terrorism.srt'),
//   crlfDelay: Infinity
});


let syncTextObjArray = [];

// Эта переменная содержит счётчик строк в файле
let countLines = 1;

// Эта строчка содержит счётчик строки субтитра
let countSectionSubtitles = 1;

// Эта переменная содержит счётчик субтитров
let countSubtitles = 1;


lineReader.on('line', (currentLineString) => {
            // Получаем текущую строчку из файла

            // console.log(`Строчка файла: ${countLines} Строчка субтитра: ${countSectionSubtitles} Текст: ${currentLineString}`);
    
            // Если текущая строка является пустой, и счётчик строк больше 3
            // Больше 3, потому, что может быть несколько строчек с текстом субтитра,
            // Начинается он с третей строчки, а так же строчек может быть несколько
            // По этому пустая строка после них считается концом субтитра
            if (currentLineString == "" && countSectionSubtitles > 3) {
                // console.log(`счётчик субтитров ${countSubtitles} номер сектора ${countSectionSubtitles}`)
                countSectionSubtitles = 1;
                countSubtitles++;
            } else {
                // Создаём объект, для хранения информации о субтитре
                let currentSyncTextObj = syncTextObjArray[countSubtitles - 1];
    
                // console.log(currentSyncTextObj);
    
                if (countSectionSubtitles == 1) {
                    // console.log("Получение номера субтитра")
                    // Если значение равно 1, то это значит что это строчка с номером субтитра
    
                    // Находим в строчке цифру
                    let match = currentLineString.match(/^\d+$/);
    
                    if (match !== null) {
                        // Если найдена цифра, то проверяем её валидность...
    
                        // Эта переменная будет содержать полученный из текста номер субтитра
                        let numberSubtitle = parseInt(match[0]);
    
    
                        if (numberSubtitle !== countSubtitles) {
                            throw new Error('Последовательность счётчика субтитров нарушена');
                        }
    
                        syncTextObjArray.push({
                            timecode: 0,
                            text: ""
                        });
    
                        // console.log(syncTextObjArray);
    
                        // увеличиваем счётчик субтитров
    
                    } else {
                        // Если номер субтитра не найден, то выкидываем ошибку
    
                        throw new Error('файл субтитров повреждён, нет номера субтитра там, где он ожидался');
                    }
                } else if (countSectionSubtitles == 2) {
                    // console.log("Получение таймкода субтитра")
                    // Если значение равно 2, то это строчка с таймкодами субтитра
    
                    let match = currentLineString.match(/^\d{2}:(\d{2}):(\d{2}),(\d{3})/);
    
                    if (match !== null) {
    
                        // получаем количество минут, секунд и милисекунд
                        let minutes = parseInt(match[1], 10);
                        let seconds = parseInt(match[2], 10);
                        let milliseconds = parseInt(match[3], 10);
    
                        // получаем количесво всех милисекунд
                        let totalMilliseconds = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
    
                        // сохраняем количество милисекунд в таймкод этой строчки
                        currentSyncTextObj.timecode = totalMilliseconds;
                    } else {
                        console.log(currentLineString);
                        throw new Error('Невалидный таймкод');
                    }
                } else if (countSectionSubtitles >= 3) {
                    // console.log("Получение текста субтитра")
                    // Если значение равно 3 и более, то это строчка с текстом субтитра
    
                    let match = currentLineString.match(/^\s*(.*)$/);
    
                    if (match !== null) {
                        let partTextWithHTML = match[1];
                        let partText = partTextWithHTML.replace(/<\s*\/?\s*\w+\s*\/?\s*>/g, '');
    
                        if (countSectionSubtitles > 3) {
                            currentSyncTextObj.text += " ";
                        }
    
                        currentSyncTextObj.text += partText;
                    } else {
                        // Если номер субтитра не найден, то выкидываем ошибку
                        throw new Error('Не найден текст субтитра');
                    }
                }
                countSectionSubtitles++;
            }
    
            // После прохождения каждой строчки увеличиваем счётчик строк
            countLines++;
});




lineReader.on('close', () => {
    let result = "";

    function calcInterval(number, delta, offset) {
        return Math.floor((number % (delta * offset)) / offset);
    }

    for (const syncTextObj of syncTextObjArray) {
        const minutes = calcInterval(syncTextObj.timecode, 60, 60 * 1000).toString().padStart(2, '0');
        const seconds = calcInterval(syncTextObj.timecode, 60, 1000).toString().padStart(2, '0');
        const milisec = calcInterval(syncTextObj.timecode, 100, 10).toString().padStart(2, '0');
        // console.log(`[${minutes}:${seconds}.${milisec}]${syncTextObj.text}`);
        result += `[${minutes}:${seconds}.${milisec}]${syncTextObj.text}\n`;
    }

    fs.writeFile("result.lir", result, function(error){
        if(error){  // если ошибка
            return console.log(error);
        }
        console.log("Файл успешно записан");
    });
})