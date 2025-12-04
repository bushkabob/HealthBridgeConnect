import Cell from "@/components/Cell";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { getDefaultHeaderHeight } from "@react-navigation/elements";
import { ScrollView, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import {
    useSafeAreaFrame,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { styles } from "./styles";

const lorem =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const fqhc =
    "A Federally Qualified Health Center (FQHC) is a community-based clinic that provides affordable primary care, dental, or behavioral health services to everyone, including people without insurance or with limited ability to pay. These centers follow strict quality and access standards and bring many services together in one place to make getting care simpler. Their mission is to ensure all patients can receive reliable, comprehensive care regardless of their income or insurance status.";

const fqhcLookalike =
    "Both FQHCs and FQHC Look-Alikes are community health centers that offer affordable medical, dental, or behavioral health services, even for people without insurance. For patients, the experience is usually very similar. The main difference is that FQHCs receive special federal funding to support their services, while FQHC Look-Alikes follow the same rules and provide the same type of care but do not receive that funding. In most cases, this difference is behind the scenes and does not affect your ability to get quality care at either type of center.";

const faqServices =
    "Health centers offer varying services including primary care, dental services, behavioral health, preventive care, and help managing chronic conditions depending on the medical professionals available. Some also offer lab work, pharmacy services, and same-day visits. The particular services a center offers can be confirmed by calling them or visiting their website.";

const faqCost =
    "Costs depend on your income and insurance status. Centers often use a sliding fee scale to make visits more affordable.";

const faqInsuranceNeeded =
    "No. You can receive care even if you don’t have insurance. If you do have insurance, the clinic will accept it if they are in network.";

const faqInsuranceAccepted =
    "Many centers accept Medicaid, Medicare, CHIP, and most private insurance plans. Because coverage varies by location, it's best to confirm with the clinic directly.";

const faqAppointment =
    "Some centers accept walk-ins, while others prefer scheduled appointments. Hours and availability vary by clinic.";

const faqBring =
    "Bring your ID, any medications you take, and your insurance card if you have one. If you're applying for discounted fees, bring proof of income.";

const faqInsuranceHelp =
    "Many centers offer help applying for Medicaid, CHIP, or Marketplace insurance plans. Ask the front desk or eligibility staff when you arrive.";

const faqInterpreter =
    "Yes. Many centers provide interpreter services or translation assistance to help you communicate clearly with your care team.";

const faqNewOrTraveling =
    "Yes. These clinics can care for patients who are new to the area or visiting temporarily.";

const faqHours =
    "Hours vary by clinic. Some locations offer evening or weekend hours. These hours can be confirmed by calling or visiting the website of individual centers.";

const faqDirections =
    "You can find the address of each clinic on its location page in this app. Selecting on this address will open directions in your maps application using your preferred method of travel (public transit, walking, driving, etc.)";

const FAQ = () => {
    const background = useThemeColor({}, "background");
    const cardBackground = useThemeColor({}, "card0");
    const textColor = useThemeColor({}, "text");

    const frame = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const headerHeight = getDefaultHeaderHeight(frame, false, insets.top);

    return (
        <View
            style={{
                backgroundColor: background,
                width: "100%",
                height: "100%",
            }}
        >
            <ScrollView
                contentContainerStyle={{ width: "100%" }}
            >
                <View style={{ height: headerHeight, width: "100%" }} />
                <View style={styles.contentView}>
                    <View
                        style={[
                            {
                                backgroundColor: cardBackground,
                            },
                            styles.shadow,
                        ]}
                    >
                        <View style={[styles.shadowOverflow]}>
                            <ExpandingContent
                                showLine
                                text="What is an FQHC?"
                                body={fqhc}
                                textColor={textColor}
                            />
                            <ExpandingContent
                                showLine
                                text="What is the difference between an FQHC and FQHC look-alike?"
                                body={fqhcLookalike}
                                textColor={textColor}
                            />
                            <ExpandingContent
                                showLine
                                text="What services do these health centers offer?"
                                body={faqServices}
                                textColor={textColor}
                            />

                            <ExpandingContent
                                showLine
                                text="How much does a visit cost?"
                                body={faqCost}
                                textColor={textColor}
                            />

                            <ExpandingContent
                                showLine
                                text="Do I need insurance to be seen?"
                                body={faqInsuranceNeeded}
                                textColor={textColor}
                            />

                            <ExpandingContent
                                showLine
                                text="What insurance plans do these clinics accept?"
                                body={faqInsuranceAccepted}
                                textColor={textColor}
                            />

                            <ExpandingContent
                                showLine
                                text="Do I need an appointment, or do they take walk-ins?"
                                body={faqAppointment}
                                textColor={textColor}
                            />

                            <ExpandingContent
                                showLine
                                text="What should I bring to my appointment?"
                                body={faqBring}
                                textColor={textColor}
                            />

                            <ExpandingContent
                                showLine
                                text="Can someone help me apply for insurance?"
                                body={faqInsuranceHelp}
                                textColor={textColor}
                            />

                            <ExpandingContent
                                showLine
                                text="Are interpreter services available?"
                                body={faqInterpreter}
                                textColor={textColor}
                            />

                            <ExpandingContent
                                showLine
                                text="Can I receive care if I'm new to the area or traveling?"
                                body={faqNewOrTraveling}
                                textColor={textColor}
                            />

                            <ExpandingContent
                                showLine
                                text="Are these clinics open in the evenings or on weekends?"
                                body={faqHours}
                                textColor={textColor}
                            />

                            <ExpandingContent
                                showLine={false}
                                text="How do I get to the clinic?"
                                body={faqDirections}
                                textColor={textColor}
                            />
                        </View>
                    </View>
                </View>
                <View style={{ height: headerHeight, width: "100%" }} />
            </ScrollView>
        </View>
    );
};

export default FAQ;

interface ExpandingContentProps {
    text: string;
    body: string;
    textColor: string;
    showLine: boolean;
}

const ExpandingContent = (props: ExpandingContentProps) => {
    const rotation = useSharedValue(0);
    const expanded = useSharedValue(0);

    const arrowStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    const bodyStyle = useAnimatedStyle(() => {
        return {
            maxHeight: withTiming(expanded.value ? 250 : 0, { duration: 220 }),
            opacity: withTiming(expanded.value ? 1 : 0, { duration: 180 }),
        };
    });

    const innerAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: withTiming(expanded.value ? 0 : -10, {
                        duration: 250,
                    }),
                },
            ],
        };
    });

    const toggle = () => {
        const exp = expanded.value === 1;
        expanded.value = exp ? 0 : 1;
        rotation.value = withTiming(exp ? 0 : 90, { duration: 150 });
    };

    return (
        <Cell showLine={props.showLine} func={toggle}>
            <View style={{ width: "100%" }}>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        gap: 10,
                    }}
                >
                    <View style={{ flexShrink: 1 }}>
                        <Text style={{color: props.textColor}} >{props.text}</Text>
                    </View>
                    <Animated.View style={arrowStyle}>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={props.textColor}
                        />
                    </Animated.View>
                </View>
                <Animated.View style={[{ overflow: "hidden" }, bodyStyle]}>
                    <Animated.View
                        style={[{ paddingTop: 20, paddingBottom: 5 }, innerAnimatedStyle]}
                    >
                        <Text style={{color: props.textColor}} >{props.body}</Text>
                    </Animated.View>
                </Animated.View>
            </View>
        </Cell>
    );
};
