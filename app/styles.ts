import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({

    shadow: {
        margin: 10,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    shadowOverflow: {
        borderRadius: 20,
        overflow: "hidden"
    },
    contentView: {
        marginTop: 30,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        padding: 10,
        margin: 10,
    },
    title: {
        marginBottom: 10,
    },
    cellInset: {
        padding: 20,
        gap: 10
    },
    titleInset: {
        padding: 20
    }
});