class LostTimecodeError extends Error {
    constructor(fileLine) {
        // console.log(text);
        super(`In line ${fileLine} there is no subtitle number where it was expected`);
        
    }
}
export default LostTimecodeError