const userList = ["JPY", "HKD", "USD"];

export function isPermittedUser(username) {
    return userList.includes(username)
}