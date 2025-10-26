export async function fetch_json(code) {
    const response = await fetch("./data/revise_data.json");
    const companies = await response.json();

    function group_Date() {
        const allGroups = companies.map(company => {
            const revise_datas = company["業績修正情報"];

            // 修正日の詳細リストを作成
            const dateDetails = revise_datas.map(data => {
                const date = data["修正日"];
                const month = parseInt(date.slice(4, 6), 10);
                const day = parseInt(date.slice(6, 8), 10);

                return {
                    date,
                    month,
                    day,
                    quarter: data["直前四半期"],
                    increase_rate: data["増減率"],
                    progress_rate: data["進捗率"],
                };
            });

            // 月日順にソート
            dateDetails.sort((a, b) =>
                a.month === b.month ? a.day - b.day : a.month - b.month
            );

            // 月日を年初からの合計日数に変換
            function total_days({ month, day }) {
                const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                let total = 0;
                for (let i = 0; i < month - 1; i++) total += daysInMonth[i];
                return total + day - 1;
            }

            // グルーピング処理
            const groups = [];
            let currentGroup = [dateDetails[0]];

            for (let i = 1; i < dateDetails.length; i++) {
                const prev = dateDetails[i - 1];
                const curr = dateDetails[i];

                const prevVal = total_days(prev);
                const currVal = total_days(curr);
                const diff = Math.min(
                    Math.abs(currVal - prevVal),
                    365 - Math.abs(currVal - prevVal)
                );

                if (diff <= 10) {
                    currentGroup.push(curr);
                } else {
                    groups.push(currentGroup);
                    currentGroup = [curr];
                }
            }
            groups.push(currentGroup);

            // 要素が3つ以上あるグループのみ残す
            const filteredGroups = groups.filter(group => group.length >= 3);

            // 直近短信の詳細リストを作成
            const latest_date = company["直近短信開示"];
            const latestDaetails = latest_date.map(data => {
                return {
                    quarter: data["四半期"],
                    progress_rate: data["進捗率"],
                };
            });

            if (filteredGroups.length > 0) {
                return {
                    "証券コード": company["証券コード"],
                    "企業名": company["企業名"],
                    "業種": company["業種"],
                    "修正グループ": filteredGroups,
                    "直近短信": latestDaetails
                };
            } else {
                return null; // 3件以上のグループがない企業は除外
            }
        });

        // null を削除
        return allGroups.filter(c => c !== null);
    }

    const groupedData = group_Date();

    return groupedData;
}
