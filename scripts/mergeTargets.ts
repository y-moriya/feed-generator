import fs from 'fs';

const generateTargetsOneWord = () => {
  const coach_fullname = JSON.parse(fs.readFileSync('resources/coach_fullname.json', 'utf-8'));
  const coach_position = JSON.parse(fs.readFileSync('resources/coach_position.json', 'utf-8'));
  const others = JSON.parse(fs.readFileSync('resources/others.json', 'utf-8'));
  const players_fullname = JSON.parse(fs.readFileSync('resources/players_fullname.json', 'utf-8'));
  const players_lastname = JSON.parse(fs.readFileSync('resources/players_lastname.json', 'utf-8'));
  // lastnameに "選手" を追加する
  const players_lastname_with_kun =
    players_lastname.map((player: string) => player + "選手");
  const players_nickname = JSON.parse(fs.readFileSync('resources/players_nickname.json', 'utf-8'));

  return [...coach_fullname,
  ...coach_position,
  ...others,
  ...players_fullname,
  ...players_lastname_with_kun,
  ...players_nickname]
}

const generateTargetsMultiWord = () => {
  const coach_lastname = JSON.parse(fs.readFileSync('resources/coach_lastname.json', 'utf-8'));
  const players_lastname = JSON.parse(fs.readFileSync('resources/players_lastname.json', 'utf-8'));

  return [...coach_lastname, ...players_lastname]
}

const run = async () => {
  // 単体でマッチする名前を読み込む
  const targetsOneWord = generateTargetsOneWord();

  // targetsOneWord.jsonに書き込む
  fs.writeFileSync('resources/targetsOneWord.json', JSON.stringify(targetsOneWord, null, 2));

  // "阪神"との組み合わせでマッチする名前を読み込む
  const targetsMultiWord = generateTargetsMultiWord();

  // targetsMultiWord.jsonに書き込む
  fs.writeFileSync('resources/targetsMultiWord.json', JSON.stringify(targetsMultiWord, null, 2));

}

run()
