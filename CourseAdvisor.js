const DiscoveryV2 = require('ibm-watson/discovery/v2');
const {IamAuthenticator }= require('ibm-watson/auth');
let collection_id;

async function queryDiscovery(  projectId,
                                discoveryAPIKey,
                                input,
                                intent,
                                url
                            ) {
    // Function to query Discovery
    try {
        const discovery = new DiscoveryV2({
            version: '2020-08-30',
            authenticator: new IamAuthenticator({
            apikey: discoveryAPIKey,
            }),
            serviceUrl: url,
        });
        let results = await discovery.listCollections({projectId});
        let collectionName = "Coursera";
        if(intent === "faq") {
            collectionName = "help center"
        }
        let collections = results.result.collections;
        let collection = collections.filter(resultVal=>{
            return resultVal.name === collectionName
        })
        collection_id = collection[0].collection_id;
        const queryResult = await discovery.query({
                                    projectId:projectId,
                                    collection_ids:[collection_id],
                                    query:input
                                });
        return queryResult;
    } catch (err) {
        throw new Error(err.message);
    }
}

async function recommendCourse(queryResult) {
    try {
        const courses = [];
        queryResult.result.results.forEach(res_result => {
            if (res_result.result_metadata.collection_id === collection_id) {
                if (courses.length <= 3) {
                    const course = {
                        name: res_result.name,
                        link: `https://www.coursera.org/learn/${res_result.slug}`,
                        description: res_result.description[0].split(".")[0]
                    };
                    courses.push(course);
                }
            }
        });
        if (courses.length === 0) {
            throw new Error("No courses are found");
        }
        return { courses };
    } catch (err) {
        throw new Error(err.message);
    }
}

async function answerFaq(queryResult) {
    try {
        let helpQueries = queryResult.result.results.filter(result=>{
            return result.result_metadata.collection_id === collection_id;
        })
        let splitTextContent = helpQueries[0].text[0].split("\n");
        let helpSolution = ""
        if (splitTextContent.length >= 10) {
            for (let i = 12; i < splitTextContent.length; i++) {
                if(splitTextContent[i] === "Was this article helpful?" ) {
                    break;
                }
                helpSolution += splitTextContent[i]+" "
            }
            return {
                res : helpSolution
            }
        } else {
            throw new Error(
            "Sorry, we are unable to find the answer from Help Centre."
            );
        }
    } catch (err) {
        throw new Error(err.message);
    }
}

const CourseraAdvisor = {
    async connectDiscovery(params) {
        const {
        discoveryAPIKey,
        projectId,
        input,
        intent,
        url
        } = params;
        try {
            const queryResult = await queryDiscovery(
            projectId,
            discoveryAPIKey,
            input,
            intent,
            url
            );
            let res;
            if (intent === "course_recommendation") {
                res = await recommendCourse(queryResult);
            } else {
                res = await answerFaq(queryResult);
            }
            return res;
        } catch (err) {
            return { err: err.message };
        }
    }
};
module.exports = CourseraAdvisor
