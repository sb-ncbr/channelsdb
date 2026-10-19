interface RType{chain: {authAsymId: string}, authSeqNumber:number, name?:string, backbone?:boolean};

export class Residues{
    public static sort(residues:string[], groupFunction?:(residues:RType[])=>RType[][], hasName?:boolean, includeBackbone?:boolean){

        if(includeBackbone===void 0){
            includeBackbone = false;
        }

        if(hasName===void 0){
            hasName = false;
        }

        if(residues.length===0){
            return residues;
        }

        let resParsed:RType[] = this.parseResidues(residues, hasName);
        let groups = [];

        if(groupFunction!==void 0){
            groups = groupFunction(resParsed);
        }
        else{
            groups.push(
                resParsed
            );
        }

        let sortFn = this.getSortFunction();
        let all:RType[] = [];
        for(let group of groups){
            all = all.concat(group.sort(sortFn));
        }

        return all.map((val,idx,array)=>{
            if(hasName){
                return `${val.name} ${val.authSeqNumber} ${val.chain.authAsymId}${(includeBackbone&&val.backbone)?' Backbone':''}`;
            }
            else{
                return `${val.authSeqNumber} ${val.chain.authAsymId}${(includeBackbone&&val.backbone)?' Backbone':''}`;
            }
        });
    }

    private static parseResidue(residue:string){
        return residue.split(" ");
    }

    public static parseResidues(residues:string[], hasName?:boolean){
        if(hasName===void 0){
            hasName = false;
        }

        let resParsed:RType[] = [];
        for(let residue of residues){
            let residueParts = this.parseResidue(residue);
            if(hasName){
                resParsed.push(
                    {
                        chain: {authAsymId: residueParts[2]}, 
                        authSeqNumber: Number(residueParts[1]),
                        name: residueParts[0],
                        backbone: (residueParts.length===4)
                    }  
                );
            }
            else{
                resParsed.push(
                    {
                        chain: {authAsymId: residueParts[1]}, 
                        authSeqNumber: Number(residueParts[0]),
                        backbone: (residueParts.length===3)
                    }  
                );
            }
        }

        return resParsed;
    }

    public static getSortFunction(){
        return (a:RType,b:RType)=>{
            if(a.chain.authAsymId<b.chain.authAsymId){
                return -1;
            }
            else if(a.chain.authAsymId>b.chain.authAsymId){
                return 1;
            }
            else{
                if(a.authSeqNumber===b.authSeqNumber){
                    if(a.backbone&&b.backbone){
                        return 0;
                    }
                    else if(a.backbone&&!b.backbone){
                        return -1;
                    }
                    else{
                        return 1;
                    }
                }

                return a.authSeqNumber-b.authSeqNumber;
            }
        };
    }
}