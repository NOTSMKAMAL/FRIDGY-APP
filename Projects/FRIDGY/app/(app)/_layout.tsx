import  {Slot, Redirect} from 'expo-router'

export default function AppLayout() {
    const session = false
    return !session ? <Redirect href = "/signin" /> : <Slot/>
}