import  {Slot, Redirect} from 'expo-router'
// CHANGE hred = "/??????" for signin, signup, login
export default function AppLayout() {
    const session = false
    return !session ? <Redirect href = "/login" /> : <Slot/>
}