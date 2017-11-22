export class Pizza {
    
        constructor(
            public id: number,
            public name: string,
            public image: string,
            public votes: number,
            public userVotes: number
        ) { }   
    }